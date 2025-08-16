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
 * @returns An object with resolvers for the `jobs` and `pipeline` queries.
 *
 * @remarks
 * - The `jobs` resolver supports filtering, searching, sorting, and pagination of job listings.
 * - The `pipeline` resolver retrieves the user's pipeline items, including associated job details.
 *
 * @example
 * const resolvers = getQueryResolvers(prisma);
 * // Use resolvers.jobs and resolvers.pipeline in your GraphQL schema
 */
export function getQueryResolvers(prisma: any) {
  return {
    jobs: async (_: any, args: any, ctx: any) => {
      if (!ctx.userId) {
        throw new GraphQLError("UNAUTHENTICATED", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const {
        minFit = 0,
        search,
        minSalary,
        location,
        sources,
        sortBy = "fit",
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
        fit_score: { gte: minFit },
        ...cursorFilter,
      };

      if (minSalary !== undefined) {
        whereClause.salary_min = { gte: minSalary };
      }
      if (location !== undefined) {
        whereClause.location = { contains: location, mode: "insensitive" };
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

      const result = await ctx.prisma.job.findMany({
        where: whereClause,
        orderBy: Object.hasOwnProperty.call(orderMap, sortBy)
          ? orderMap[sortBy]
          : orderMap.fit,
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
          salaryMin: job.salary_min,
          salaryMax: job.salary_max,
          url: job.url,
          publishedAt: job.published_at,
          vector: job.vector,
          fitScore: job.fit_score,
        })),
        endCursor,
        hasNextPage,
      };
    },
    pipeline: (_: any, __: any, ctx: any) => {
      if (!ctx.userId) {
        throw new GraphQLError("UNAUTHENTICATED", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      return ctx.prisma.pipelineItem.findMany({
        where: { user_id: ctx.userId },
        include: { job: true },
        orderBy: [{ column: "asc" }, { position: "asc" }],
      });
    },
  };
}
