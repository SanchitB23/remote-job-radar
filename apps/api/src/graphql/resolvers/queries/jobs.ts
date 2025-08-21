import { GraphQLError } from "graphql";

import type {
  AuthenticatedGraphQLContext,
  JobParent,
  JobResult,
  JobsQueryArgs,
} from "@/types/resolvers";

const IVFFLAT_PROBES = 10;

const sortFieldMap: Record<string, string> = {
  FIT: "fit_score",
  DATE: "published_at",
  SALARY: "salary_min",
};

export const jobs = async (
  _: unknown,
  args: JobsQueryArgs,
  ctx: AuthenticatedGraphQLContext,
): Promise<{
  edges: Array<JobResult>;
  endCursor: string | null;
  hasNextPage: boolean;
}> => {
  if (!ctx.userId) {
    throw new GraphQLError("UNAUTHENTICATED", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  try {
    const {
      minFit,
      search,
      minSalary,
      location,
      workType,
      sources,
      sortBy = "FIT",
      first = 50,
      after,
      bookmarked,
      isTracked,
    } = args;

    let edges, endCursor, hasNextPage;

    // ---- check if we should personalize
    const profile = ctx.userId
      ? await ctx.prisma.user_profile.findUnique({
          where: { user_id: ctx.userId },
          select: { skills: true },
        })
      : null;

    const hasSkills = !!profile && Array.isArray(profile.skills) && profile.skills.length > 0;

    // ---------- PERSONALIZED PATH (raw SQL with pgvector) ----------
    if (hasSkills) {
      // build WHERE clauses + params
      const clauses: string[] = [];
      const params: unknown[] = [];
      let i = 1;

      // after cursor (id base64)
      if (after) {
        const afterId = Buffer.from(after, "base64").toString("utf8");
        clauses.push(`j.id > $${i}`);
        params.push(afterId);
        i++;
      }

      if (minSalary !== undefined) {
        clauses.push(`j.salary_min >= $${i}`);
        params.push(minSalary);
        i++;
      }
      if (location !== undefined) {
        clauses.push(`j.location ILIKE $${i}`);
        params.push(`%${location}%`);
        i++;
      }
      if (workType !== undefined) {
        clauses.push(`j.work_type ILIKE $${i}`);
        params.push(`%${workType}%`);
        i++;
      }
      if (sources && sources.length) {
        clauses.push(`LOWER(j.source) = ANY($${i})`);
        params.push(sources.map((s: string) => s.toLowerCase()));
        i++;
      }
      if (search) {
        clauses.push(`(j.title ILIKE $${i} OR j.description ILIKE $${i + 1})`);
        params.push(`%${search}%`, `%${search}%`);
        i += 2;
      }
      if (bookmarked) {
        clauses.push(
          `EXISTS (SELECT 1 FROM "bookmarks" b WHERE b.job_id = j.id AND b.user_id = $${i})`,
        );
        params.push(ctx.userId);
        i++;
      }
      if (isTracked) {
        clauses.push(
          `EXISTS (SELECT 1 FROM "pipeline_items" p WHERE p.job_id = j.id AND p.user_id = $${i})`,
        );
        params.push(ctx.userId);
        i++;
      }

      // minFit filter works on computed score; we’ll add it after we compute fit_score
      const whereSQL = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

      // ORDER BY
      const orderSQL = (() => {
        switch (sortBy) {
          case "DATE":
            return `j.${sortFieldMap.DATE} DESC`;
          case "SALARY":
            return `j.${sortFieldMap.SALARY} DESC NULLS LAST`;
          case "FIT":
          default:
            return `fit_score DESC NULLS LAST`;
        }
      })();

      // personalized query
      // NOTE: we compute fit_score in a subselect so we can filter by minFit safely
      const baseSQL = `
        WITH up AS (
          SELECT "skill_vector" FROM "user_profiles" WHERE "user_id" = $${i}
        ),
        ranked AS (
          SELECT
            j.id, j.source, j.title, j.company, j.description, j.location,
            j.work_type, j.salary_min, j.salary_max, j.url, j.published_at, j.vector,
            (100 * (1 - (j.vector <=> (SELECT "skill_vector" FROM up)))) AS fit_score
          FROM "jobs" j
          ${whereSQL}
        )
        SELECT *
        FROM ranked
        /**MINFIT**/
        ORDER BY ${orderSQL}
        LIMIT $${i + 1}
      `;

      const paramsWithUserAndLimit = [...params, ctx.userId, first + 1];

      // add minFit clause if provided
      const sql = baseSQL.replace(
        "/**MINFIT**/",
        minFit !== undefined && minFit !== null
          ? `WHERE fit_score >= $${paramsWithUserAndLimit.length}`
          : "",
      );

      const finalParams =
        minFit !== undefined && minFit !== null
          ? [...paramsWithUserAndLimit, minFit]
          : paramsWithUserAndLimit;

      // optional ANN tuning
      await ctx.prisma.$executeRawUnsafe(`SET LOCAL ivfflat.probes = ${IVFFLAT_PROBES};`);

      const rows = await ctx.prisma.$queryRawUnsafe<JobParent[]>(sql, ...finalParams);

      edges = rows.slice(0, first);
      endCursor =
        edges.length > 0 ? Buffer.from(edges[edges.length - 1]!.id).toString("base64") : null;
      hasNextPage = rows.length > first;
    } else {
      const cursorFilter = after
        ? { id: { gt: Buffer.from(after, "base64").toString("utf8") } }
        : undefined;

      const normalizedSources =
        sources && sources.length ? sources.map((s: string) => s.toLowerCase()) : undefined;

      const whereClause: Record<string, unknown> = {
        ...cursorFilter,
      };
      if (minFit !== undefined && minFit !== null) {
        whereClause.fit_score = { gte: minFit };
      }
      if (minSalary !== undefined) {
        whereClause.salary_min = { gte: minSalary };
      }
      if (location !== undefined) {
        whereClause.location = { contains: location, mode: "insensitive" };
      }
      if (workType !== undefined) {
        whereClause.work_type = { contains: workType, mode: "insensitive" };
      }
      if (normalizedSources !== undefined) {
        whereClause.source = { in: normalizedSources };
      }
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
      if (bookmarked) {
        whereClause.bookmarks = {
          some: { user_id: ctx.userId },
        };
      }
      if (isTracked) {
        whereClause.pipeline_items = {
          some: { user_id: ctx.userId },
        };
      }

      const result = await ctx.prisma.job.findMany({
        where: whereClause,
        orderBy: {
          [sortFieldMap[sortBy] || "fit_score"]: {
            sort: "desc",
            nulls: "last",
          },
        },
        take: first + 1,
      });
      edges = result.slice(0, first);
      endCursor =
        edges.length > 0 ? Buffer.from(edges[edges.length - 1]!.id).toString("base64") : null;
      hasNextPage = result.length > first;
    }
    return {
      edges: edges.map((job: JobParent) => ({
        id: job.id,
        source: (job.source ?? "").toUpperCase(),
        title: job.title,
        company: job.company,
        description: job.description,
        location: job.location,
        workType: job.work_type,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        url: job.url,
        publishedAt: job.published_at,
        vector: job.vector,
        fitScore: job.fit_score ?? 0,
      })),
      endCursor,
      hasNextPage,
    };
  } catch (error) {
    console.error("Error in jobs query:", error);
    throw new GraphQLError("Failed to fetch jobs");
  }
};
