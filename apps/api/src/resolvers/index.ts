import { PrismaClient } from "@prisma/client";
import { PubSub, withFilter } from "graphql-subscriptions";
import pg from "pg";

const pubsub = new PubSub();
const NEW_JOB = "NEW_JOB";

const orderMap: Record<string, { [key: string]: "asc" | "desc" }> = {
  fit: { fit_score: "desc" },
  date: { published_at: "desc" },
  salary: { salary_min: "desc" },
};

export function getResolvers(prisma: PrismaClient) {
  // --- hook Postgres NOTIFY to PubSub ---
  const listener = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  listener.connect().then(() => {
    listener.query("LISTEN new_job");
    listener.on("notification", async (msg) => {
      const jobId = msg.payload;
      if (jobId) {
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (job) {
          // Transform database fields to GraphQL schema format
          const transformedJob = {
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
            fitScore: job.fit_score, // Transform snake_case to camelCase
          };
          pubsub.publish(NEW_JOB, { newJob: transformedJob });
        }
      }
    });
  });

  return {
    Query: {
      jobs: async (_: any, args: any, ctx: any) => {
        const {
          minFit = 0,
          search,
          minSalary,
          location,
          sources,
          sortBy = "fit",
          first = 50,
          after,
        } = args;

        const cursorFilter = after
          ? { id: { gt: Buffer.from(after, "base64").toString("utf8") } }
          : undefined;

        console.log("🔍 Jobs query called with args:", args);
        console.log("📋 Context userId:", ctx.userId);

        // Normalize sources to lowercase for DB filtering
        const normalizedSources =
          sources && sources.length
            ? sources.map((s: string) => s.toLowerCase())
            : undefined;

        const whereClause = {
          fit_score: { gte: minFit },
          salary_min: minSalary ? { gte: minSalary } : undefined,
          location: location
            ? { contains: location, mode: "insensitive" }
            : undefined,
          source: normalizedSources ? { in: normalizedSources } : undefined,
          OR: search
            ? [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ]
            : undefined,
          ...cursorFilter,
        };

        console.log("🔎 Where clause:", JSON.stringify(whereClause, null, 2));

        const result = await ctx.prisma.job.findMany({
          where: whereClause,
          orderBy: orderMap.hasOwnProperty(sortBy)
            ? orderMap[sortBy]
            : orderMap.fit,
          take: first + 1, // fetch one extra to check hasNextPage
        });

        console.log("✅ Query result count:", result.length);

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
    },

    Mutation: {
      bookmark: async (_: any, { id }: any, ctx: any) => {
        try {
          if (!ctx.userId) throw new Error("UNAUTHENTICATED");

          const where = { user_id_job_id: { user_id: ctx.userId, job_id: id } };

          const existing = await ctx.prisma.bookmark.findUnique({ where });
          if (existing) {
            await ctx.prisma.bookmark.delete({ where });
            return false; // now unbookmarked
          }

          await ctx.prisma.bookmark.create({
            data: { user_id: ctx.userId, job_id: id },
          });
          return true; // now bookmarked
        } catch (error) {
          console.error("Error occurred while bookmarking:", error);
          throw new Error("Failed to bookmark job");
        }
      },
    },

    Subscription: {
      newJob: {
        subscribe: withFilter(
          () => pubsub.asyncIterator(NEW_JOB),
          (payload: any, variables: any) => {
            return payload.newJob.fitScore >= (variables.minFit || 0);
          }
        ),
      },
    },

    Job: {
      bookmarked: async (parent: any, _: any, ctx: any) => {
        const count = await ctx.prisma.bookmark.count({
          where: { user_id: ctx.userId, job_id: parent.id },
        });
        return count > 0;
      },
    },
  };
}
