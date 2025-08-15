"use client";

import { GRAPHQL_WS_ENDPOINT } from "@/constants";
import { NEW_JOB_SUBSCRIPTION } from "@/constants/gqlQueries";
import type { Client, Sink } from "graphql-ws";
import { createClient } from "graphql-ws";

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
}) {
  return wsClient.subscribe(
    {
      query: NEW_JOB_SUBSCRIPTION,
      variables: { minFit },
    },
    {
      next,
      error: error || ((err) => { console.error("GraphQL subscription error:", err); }),
      complete: complete || (() => { console.log("Subscription completed."); }),
    }
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

export async function getWSClient(jwt?: string) {
  const connectionParams = jwt ? { Authorization: `Bearer ${jwt}` } : {};

  return createClient({
    url: GRAPHQL_WS_ENDPOINT,
    connectionParams,
  });
}
