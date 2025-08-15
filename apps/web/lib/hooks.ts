"use client";

import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import {
  fetchJobsApi,
  toggleBookmarkApi,
  fetchPipelineApi,
  upsertPipelineItemApi,
} from "../services/api-client";
import { FetchJobsParams, JobsConnection } from "@/types/gql";

// Custom hook for infinite pagination of jobs
export function useInfiniteJobs(params: Omit<FetchJobsParams, "after"> = {}) {
  return useInfiniteQuery({
    queryKey: ["jobs-infinite", params],
    queryFn: async ({ pageParam }) => {
      const queryParams = { ...params, after: pageParam };
      return fetchJobsApi(queryParams);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      return toggleBookmarkApi(jobId);
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
  return useQuery({
    queryKey: ["pipeline"],
    queryFn: async () => {
      return fetchPipelineApi();
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    enabled: true,
  });
}

// Custom hook for pipeline upsert mutation
export function usePipelineUpsertMutation() {
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
      return upsertPipelineItemApi(jobId, column, position);
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
