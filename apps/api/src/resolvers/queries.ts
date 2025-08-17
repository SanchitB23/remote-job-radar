import { GraphQLError } from "graphql";
import { Prisma } from "@prisma/client";

const orderMap: Record<string, { [key: string]: "asc" | "desc" }> = {
  fit: { fit_score: "desc" },
  date: { published_at: "desc" },
  salary: { salary_min: "desc" },
};

/**
 * Returns an object containing GraphQL query resolvers for jobs and pipeline items.
 *
 * @param prisma - The Prisma client instance used for database operations.
 * @returns An object with resolvers for the `jobs`, `pipeline`, and `filterMetadata` queries.
 *
 * @remarks
 * - The `jobs` resolver supports filtering, searching, sorting, and pagination of job listings.
 * - The `pipeline` resolver retrieves the user's pipeline items, including associated job details.
 * - The `filterMetadata` resolver provides dynamic filter options based on current job data.
 *
 * @example
 * const resolvers = getQueryResolvers(prisma);
 * // Use resolvers.jobs, resolvers.pipeline, and resolvers.filterMetadata in your GraphQL schema
 */
export function getQueryResolvers(prisma: any) {
  return {
    jobs: async (_: any, args: any, ctx: any) => {
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

        // Normalize sources to lowercase for DB filtering
        const normalizedSources =
          sources && sources.length
            ? sources.map((s: string) => s.toLowerCase())
            : undefined;

        let whereClause: Prisma.jobWhereInput = {
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
          ] as Prisma.jobWhereInput[];
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
        // Map enum value to DB field
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
          take: first + 1, // fetch one extra to check hasNextPage
        });
        const edges = result.slice(0, first);
        const endCursor = edges.length
          ? Buffer.from(edges[edges.length - 1].id).toString("base64")
          : null;
        const hasNextPage = result.length > first;

        // Convert snake_case to camelCase for each job
        return {
          edges: edges.map((job: any) => ({
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
    },
    pipeline: async (_: any, __: any, ctx: any) => {
      if (!ctx.userId) {
        throw new GraphQLError("UNAUTHENTICATED", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      try {
        return await ctx.prisma.pipelineItem.findMany({
          where: { user_id: ctx.userId },
          include: { job: true },
          orderBy: [{ column: "asc" }, { position: "asc" }],
        });
      } catch (error) {
        console.error("Error in pipeline query:", error);
        throw new GraphQLError("Failed to fetch pipeline items");
      }
    },
    filterMetadata: async (_: any, __: any, ctx: any) => {
      if (!ctx.userId) {
        throw new GraphQLError("UNAUTHENTICATED", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      try {
        // Get fit score range
        const fitScoreStats = await ctx.prisma.job.aggregate({
          _min: { fit_score: true },
          _max: { fit_score: true },
          where: { fit_score: { not: null } },
        });

        // Get salary range
        const salaryStats = await ctx.prisma.job.aggregate({
          _min: { salary_min: true },
          _max: { salary_max: true },
          where: {
            OR: [{ salary_min: { not: null } }, { salary_max: { not: null } }],
          },
        });

        // Get distinct sources (filter out null/empty in JS)
        const sourceResults = await ctx.prisma.job.findMany({
          select: { source: true },
          distinct: ["source"],
        });

        const sources = sourceResults
          .map((s: any) => s.source)
          .filter((source: string) => source && source.trim() !== "");

        // Get top 50 most common locations
        const locations = await ctx.prisma.job.groupBy({
          by: ["location"],
          _count: { location: true },
          where: {
            location: {
              not: null,
              notIn: ["", "Remote", "Worldwide"], // Exclude generic locations
            },
          },
          orderBy: { _count: { location: "desc" } },
          take: 50,
        });

        // Get top 50 most common work types
        const workTypes = await ctx.prisma.job.groupBy({
          by: ["work_type"],
          _count: { work_type: true },
          where: {
            work_type: {
              not: null,
              notIn: [""], // Exclude empty work types
            },
          },
          orderBy: { _count: { work_type: "desc" } },
          take: 50,
        });

        return {
          fitScore: {
            min: fitScoreStats._min.fit_score ?? 0,
            max: fitScoreStats._max.fit_score ?? 100,
          },
          salary: {
            min: salaryStats._min.salary_min ?? 0,
            max: Math.max(
              salaryStats._max.salary_min ?? 0,
              salaryStats._max.salary_max ?? 0
            ),
          },
          sources: sources.map((s: string) => s.toUpperCase()).filter(Boolean),
          locations: locations.map((l: any) => l.location).filter(Boolean),
          workTypes: workTypes.map((w: any) => w.work_type).filter(Boolean),
        };
      } catch (error) {
        console.error("Error in filterMetadata query:", error);
        throw new GraphQLError("Failed to fetch filter metadata");
      }
    },
  };
}
