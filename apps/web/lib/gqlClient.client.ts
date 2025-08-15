"use client";

import type { Client, Sink } from "graphql-ws";
import { createClient } from "graphql-ws";
import {
  FetchJobsParams,
  fetchJobsShared,
  GRAPHQL_WS_ENDPOINT,
  toggleBookmarkShared,
} from "./shared-gql";

// Subscription query for new jobs
export const NEW_JOB_SUBSCRIPTION = `#graphql
  subscription NewJob($minFit: Float) {
    newJob(minFit: $minFit) {
      id
      title
      company
      url
      fitScore
    }
  }
`;

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
      error: error || (() => {}),
      complete: complete || (() => {}),
    }
  );
}

// Client-side API functions for React Query

// Client-side fetch jobs connection function - returns full connection data for pagination
export async function fetchJobsConnectionClient(
  params: FetchJobsParams,
  token?: string
) {
  return fetchJobsShared(params, token);
}

// Client-side bookmark toggle function - can be used with manual token
export async function toggleBookmarkClient(
  jobId: string,
  token?: string
): Promise<{ bookmark: boolean }> {
  return toggleBookmarkShared(jobId, token);
}

export async function getWSClient(jwt?: string) {
  const connectionParams = jwt ? { Authorization: `Bearer ${jwt}` } : {};

  return createClient({
    url: GRAPHQL_WS_ENDPOINT,
    connectionParams,
  });
}
