"use client";

import { useAuth } from "@clerk/nextjs";
import type { Client } from "graphql-ws";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

import { getWSClient, subscribeToNewJobs } from "@/services/gql-sub";

// Configurable minimum fit score for job alerts
const MIN_FIT_SCORE = 8;

interface NewJobData {
  newJob: {
    id: string;
    title: string;
    company: string;
    url: string;
    fitScore: number;
  };
}

export default function JobAlerts(): null {
  const { getToken } = useAuth();

  const wsClientRef = useRef<Client | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const jwt = await getToken({ template: "remote-job-radar" });
        console.log("🔑 WebSocket auth ready:", { hasToken: !!jwt });

        wsClientRef.current = await getWSClient(jwt || undefined);
        console.log("🔌 Starting WebSocket subscription...");
        subscribeToNewJobs({
          wsClient: wsClientRef.current,
          minFit: MIN_FIT_SCORE,
          next: ({ data }: { data: NewJobData }) => {
            console.log("📢 New job notification:", data);
            const job = data?.newJob;
            if (job) {
              toast.success(
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  New match ({job.fitScore}%): {job.title} — {job.company}
                </a>,
              );
            }
          },
          error: (error: unknown) => {
            console.error("❌ WebSocket subscription error:", {
              error,
              type: typeof error,
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              timestamp: new Date().toISOString(),
            });
          },
          complete: () => {
            console.log("✅ WebSocket subscription completed");
          },
        });
      } catch (error) {
        console.error("❌ Failed to setup WebSocket subscription:", {
          error,
          type: typeof error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          endpoint: process.env.NEXT_PUBLIC_GRAPHQL_WS_ENDPOINT || "ws://localhost:4000/graphql",
          timestamp: new Date().toISOString(),
        });
      }
    })();

    // Cleanup function
    return () => {
      if (wsClientRef.current) {
        console.log("🔌 Cleaning up WebSocket connection...");
        wsClientRef.current.dispose();
        wsClientRef.current = null;
      }
    };
  }, [getToken]);

  return null;
}
