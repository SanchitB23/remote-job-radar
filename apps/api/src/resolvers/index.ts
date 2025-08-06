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
          fitScore: minFit ? { gte: minFit } : undefined,
          salaryMin: minSalary ? { gte: minSalary } : undefined,
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

        // Check jobs matching our criteria
        const matchingJobsCount = await ctx.prisma.job.count({
          where: whereClause,
        });
        console.log("🎯 Jobs matching criteria:", matchingJobsCount);

        // Get some sample fitScores to understand the data
        const fitScoreSample = await ctx.prisma.job.findMany({
          select: { id: true, fitScore: true, title: true, publishedAt: true },
          orderBy: [
            { fitScore: { sort: "desc", nulls: "last" } },
            { publishedAt: "desc" },
          ],
          take: 5,
        });
        console.log("📈 Sample fitScores (top 5):", fitScoreSample);

        const result = await ctx.prisma.job.findMany({
          where: whereClause,
          orderBy: [
            { fitScore: { sort: "desc", nulls: "last" } },
            { publishedAt: "desc" },
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
                fitScore: result[0].fitScore,
                publishedAt: result[0].publishedAt,
              }
            : "No jobs found"
        );

        return result.map((r: any) => ({
          ...r,
          bookmarked: false /* resolved below */,
        }));
      },
    },

    Mutation: {
      bookmark: async (_: any, { id }: any, ctx: any) => {
        await ctx.prisma.bookmark.upsert({
          where: { userId_jobId: { userId: ctx.userId, jobId: id } },
          create: { userId: ctx.userId, jobId: id },
          update: {},
        });
        return true;
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
          where: { userId: ctx.userId, jobId: parent.id },
        });
        return count > 0;
      },
    },
  };
}
