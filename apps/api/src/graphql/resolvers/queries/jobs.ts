import { GraphQLError } from "graphql";

import type { AuthenticatedGraphQLContext, JobParent, JobsQueryArgs } from "@/types/resolvers";

export const jobs = async (_: unknown, args: JobsQueryArgs, ctx: AuthenticatedGraphQLContext) => {
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
    const sortFieldMap: Record<string, string> = {
      FIT: "fit_score",
      DATE: "published_at",
      SALARY: "salary_min",
    };
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
    const edges = result.slice(0, first);
    const endCursor =
      edges.length > 0 ? Buffer.from(edges[edges.length - 1]!.id).toString("base64") : null;
    const hasNextPage = result.length > first;
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
