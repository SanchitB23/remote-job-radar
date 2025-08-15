"use client";

import { createClient } from "graphql-ws";
import type { Client, Sink } from "graphql-ws";
import { useAuth } from "@clerk/nextjs";
import {
  fetchJobsShared,
  toggleBookmarkShared,
  createGraphQLClient,
  type Job,
  type FetchJobsParams,
  GRAPHQL_WS_ENDPOINT,
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

// Client-side fetch jobs function - can be used with manual token
export async function fetchJobsClient(
  params: FetchJobsParams,
  token?: string
): Promise<{ jobs: Job[] }> {
  const jobsConnection = await fetchJobsShared(params, token);
  return {
    jobs: Array.isArray(jobsConnection?.edges) ? jobsConnection.edges : [],
  };
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

// React Hook for WebSocket client with automatic auth
export function useWSClient() {
  const { getToken } = useAuth();

  return {
    getWSClient: async () => {
      const token = await getToken({ template: "remote-job-radar" });
      return createClient({
        url: GRAPHQL_WS_ENDPOINT,
        connectionParams: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
  };
}

// Comprehensive hook that provides all GraphQL operations with automatic auth
export function useGraphQL() {
  const { getToken } = useAuth();

  return {
    fetchJobs: async (params: FetchJobsParams) => {
      const token = await getToken({ template: "remote-job-radar" });
      return fetchJobsShared(params, token);
    },
    toggleBookmark: async (jobId: string) => {
      const token = await getToken({ template: "remote-job-radar" });
      return toggleBookmarkShared(jobId, token);
    },
    getWSClient: async () => {
      const token = await getToken({ template: "remote-job-radar" });
      return createClient({
        url: GRAPHQL_WS_ENDPOINT,
        connectionParams: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    getClient: async () => {
      const token = await getToken({ template: "remote-job-radar" });
      return createGraphQLClient(token);
    },
  };
}
