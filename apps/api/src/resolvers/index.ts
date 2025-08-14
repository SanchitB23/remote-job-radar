import { PrismaClient } from "@prisma/client";
import { PubSub, withFilter } from "graphql-subscriptions";
import pg from "pg";

const pubsub = new PubSub();
const NEW_JOB = "NEW_JOB";

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
        if (job) pubsub.publish(NEW_JOB, { newJob: job });
      }
    });
  });

  return {
    Query: {
      jobs: async (_: any, args: any, ctx: any) => {
        const { minFit, search, minSalary, location, first } = args;

        console.log("🔍 Jobs query called with args:", args);
        console.log("📋 Context userId:", ctx.userId);

        const whereClause = {
          fit_score: minFit ? { gte: minFit } : undefined,
          salary_min: minSalary ? { gte: minSalary } : undefined,
          location: location
            ? { contains: location, mode: "insensitive" }
            : undefined,
          OR: search
            ? [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ]
            : undefined,
        };

        console.log("🔎 Where clause:", JSON.stringify(whereClause, null, 2));

        // First, let's check total job count
        const totalJobs = await ctx.prisma.job.count();
        console.log("📊 Total jobs in database:", totalJobs);

        const result = await ctx.prisma.job.findMany({
          where: whereClause,
          orderBy: [
            { fit_score: { sort: "desc", nulls: "last" } },
            { published_at: "desc" },
          ],
          take: first,
        });

        console.log("✅ Query result count:", result.length);

        console.log(
          "📝 First job result:",
          result[0]
            ? {
                id: result[0].id,
                title: result[0].title,
                fitScore: result[0].fit_score,
                publishedAt: result[0].published_at,
              }
            : "No jobs found"
        );

        // Convert snake_case to camelCase for each job
        return result.map((job: any) => ({
          id: job.id,
          source: job.source,
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
        }));
      },
    },

    Mutation: {
      // TODO: Add bookmark mutation once Bookmark table is created
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

    // TODO: Add Job.bookmarked resolver once Bookmark table is created
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
