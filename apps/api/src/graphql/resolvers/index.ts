import type { PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import pg from "pg";

import { getJobFieldResolvers } from "./job";
import { getMutationResolvers } from "./mutations";
import { getQueryResolvers } from "./queries";
import { getSubscriptionResolvers } from "./subscriptions";

const pubsub = new PubSub();
const NEW_JOB = "NEW_JOB";

export function getResolvers(prisma: PrismaClient): any {
  // --- hook Postgres NOTIFY to PubSub ---
  const listener = new pg.Client({
    connectionString: process.env.PG_DATABASE_URL,
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
    Query: getQueryResolvers(prisma),
    Mutation: getMutationResolvers(prisma),
    Subscription: getSubscriptionResolvers(pubsub, NEW_JOB),
    Job: getJobFieldResolvers(),
  };
}
