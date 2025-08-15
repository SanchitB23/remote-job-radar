"use client";

import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  fetchJobsConnectionClient,
  toggleBookmarkClient,
} from "./gqlClient.client";
import { fetchPipelineShared, upsertPipelineItemShared } from "./shared-gql";
import { FetchJobsParams, JobsConnection } from "./shared-gql";

// Custom hook for infinite pagination of jobs
export function useInfiniteJobs(params: Omit<FetchJobsParams, "after"> = {}) {
  const { getToken } = useAuth();

  return useInfiniteQuery({
    queryKey: ["jobs-infinite", params],
    queryFn: async ({ pageParam }) => {
      const token = await getToken({ template: "remote-job-radar" });
      const queryParams = { ...params, after: pageParam };
      return fetchJobsConnectionClient(queryParams, token || undefined);
    },
    getNextPageParam: (lastPage: JobsConnection) => {
      return lastPage.hasNextPage ? lastPage.endCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    enabled: true,
  });
}

// Custom hook for bookmark mutation
export function useBookmarkMutation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const token = await getToken({ template: "remote-job-radar" });
      return toggleBookmarkClient(jobId, token || undefined);
    },
    onSuccess: () => {
      // Invalidate and refetch both regular and infinite queries
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs-infinite"] });
    },
    onError: (error) => {
      console.error("Bookmark mutation error:", error);
    },
  });
}

// Custom hook for fetching pipeline data
export function usePipeline() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["pipeline"],
    queryFn: async () => {
      const token = await getToken({ template: "remote-job-radar" });
      return fetchPipelineShared(token || undefined);
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    enabled: true,
  });
}

// Custom hook for pipeline upsert mutation
export function usePipelineUpsertMutation() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      column,
      position,
    }: {
      jobId: string;
      column: string;
      position: number;
    }) => {
      const token = await getToken({ template: "remote-job-radar" });
      return upsertPipelineItemShared(jobId, column, position, token);
    },
    onSuccess: () => {
      // Invalidate and refetch pipeline queries
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    },
    onError: (error) => {
      console.error("Pipeline upsert mutation error:", error);
    },
  });
}
