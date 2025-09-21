"use client";

import type { Client, Sink } from "graphql-ws";
import { createClient } from "graphql-ws";

import { GRAPHQL_WS_ENDPOINT } from "@/constants";
import { NEW_JOB_SUBSCRIPTION } from "@/constants/gqlQueries";

// Utility to subscribe to new jobs via WebSocket
export function subscribeToNewJobs({
  minFit = 8,
  wsClient,
  next,
  error,
  complete,
}: {
  minFit?: number;
  wsClient: Client;
  next: Sink["next"];
  error?: Sink["error"];
  complete?: Sink["complete"];
}): () => void {
  return wsClient.subscribe(
    {
      query: NEW_JOB_SUBSCRIPTION,
      variables: { minFit },
    },
    {
      next,
      error:
        error ||
        ((err) => {
          console.error("GraphQL subscription error:", err);
        }),
      complete:
        complete ||
        (() => {
          console.log("Subscription completed.");
        }),
    },
  );
}

// Client-side API functions for React Query

// UNUSED: Client-side fetch jobs connection function - returns full connection data for pagination
// This function is not used anywhere in the codebase
// export async function fetchJobsConnectionClient(
//   params: FetchJobsParams,
//   token?: string
// ) {
//   return fetchJobsShared(params, token);
// }

// UNUSED: Client-side bookmark toggle function - can be used with manual token
// This function is not used anywhere in the codebase
// export async function toggleBookmarkClient(
//   jobId: string,
//   token?: string
// ): Promise<{ bookmark: boolean }> {
//   return toggleBookmarkShared(jobId, token);
// }

export async function getWSClient(jwt?: string): Promise<Client> {
  const connectionParams = jwt ? { Authorization: `Bearer ${jwt}` } : {};

  // Log WebSocket connection attempt (production-safe)
  console.log("🔌 WebSocket connecting to:", GRAPHQL_WS_ENDPOINT, { hasAuth: !!jwt });

  return createClient({
    url: GRAPHQL_WS_ENDPOINT,
    connectionParams,
    retryAttempts: 5,
    retryWait: async function waitForRetry(retries) {
      console.log(`🔄 WebSocket retry attempt ${retries + 1}/5...`);
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.min(1000 * Math.pow(2, retries), 16000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    },
    on: {
      error: (err) => {
        console.error("❌ WebSocket client error:", err);
      },
      closed: (event) => {
        console.log("🔌 WebSocket client closed:", event);
      },
      connected: (socket) => {
        console.log("✅ WebSocket client connected:", GRAPHQL_WS_ENDPOINT);
      },
      connecting: () => {
        console.log("🔄 WebSocket client connecting...");
      },
    },
  });
}
