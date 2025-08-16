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
import { FetchJobsParams, JobsConnection, FilterMetadata } from "@/types/gql";

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

// Custom hook for fetching filter metadata
export function useFilterMetadata() {
  return useQuery({
    queryKey: ["filter-metadata"],
    queryFn: async (): Promise<FilterMetadata> => {
      const response = await fetch("/api/filters");
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes (filters don't change often)
    enabled: typeof window !== "undefined", // Only run on client side to prevent SSR issues
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for 401/403 errors
      if (error.message.includes("401") || error.message.includes("403")) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
