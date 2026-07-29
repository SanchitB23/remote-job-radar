import type { IResolvers } from "@graphql-tools/utils";
import type { PrismaClient } from "@prisma/client";
import { DateTimeResolver } from "graphql-scalars";
import { PubSub } from "graphql-subscriptions";

import { pgHealthMonitor } from "@/lib/postgresql-health";
import { type NotificationHandler, PostgreSQLListener } from "@/lib/postgresql-listener";

import { getJobFieldResolvers } from "./job.js";
import { getMutationResolvers } from "./mutations.js";
import { getQueryResolvers } from "./queries.js";
import { getSubscriptionResolvers } from "./subscriptions.js";

const pubsub = new PubSub();
const NEW_JOB = "NEW_JOB";

// Global PostgreSQL listener instance
let pgListener: PostgreSQLListener | null = null;

export function getResolvers(prisma: PrismaClient): IResolvers<string, unknown> {
  // --- hook Postgres NOTIFY to PubSub with robust connection management ---
  if (!pgListener) {
    pgListener = new PostgreSQLListener({
      connectionString: process.env.PG_DATABASE_URL!,
      reconnectInterval: parseInt(process.env.PG_LISTENER_RECONNECT_INTERVAL || "5000"),
      maxReconnectAttempts: parseInt(process.env.PG_LISTENER_MAX_RECONNECT_ATTEMPTS || "50"),
      connectionTimeoutMillis: parseInt(process.env.PG_LISTENER_CONNECTION_TIMEOUT || "30000"),
      idleTimeoutMillis: 0, // Disable idle timeout to prevent disconnections
      keepAlive: true, // Enable TCP keepalive
      keepAliveInitialDelayMillis: parseInt(process.env.PG_LISTENER_KEEPALIVE_DELAY || "30000"),
    });

    // Connect health monitor to the listener
    pgHealthMonitor.setListener(pgListener);

    // Set up notification handler for new jobs
    const newJobHandler: NotificationHandler = async (channel: string, payload: string | null) => {
      pgHealthMonitor.recordNotification();

      const jobId = payload;
      if (jobId) {
        try {
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
        } catch (error) {
          console.error("[GraphQL] Error processing new job notification:", error);
          pgHealthMonitor.recordNotificationError();
        }
      }
    };

    pgListener.listen("new_job", newJobHandler);

    // Start the connection and track health metrics
    pgHealthMonitor.recordConnectionAttempt();

    pgListener
      .connect()
      .then(() => {
        pgHealthMonitor.recordConnectionSuccess();
        console.log("[GraphQL] PostgreSQL listener connected successfully");
        console.log(`[GraphQL] Connection status: ${pgHealthMonitor.getStatusSummary()}`);
      })
      .catch((error: Error) => {
        pgHealthMonitor.recordConnectionFailure(error.message);
        console.error("[GraphQL] Failed to establish PostgreSQL listener connection:", error);
      });
  }

  return {
    DateTime: DateTimeResolver,
    Query: getQueryResolvers(prisma),
    Mutation: getMutationResolvers(prisma),
    Subscription: getSubscriptionResolvers(pubsub, NEW_JOB),
    Job: getJobFieldResolvers(),
  };
}
