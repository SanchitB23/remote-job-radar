"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { fetchJobsClient, toggleBookmarkClient } from "./gqlClient.client";
import { FetchJobsParams, Job } from "./shared-gql";

// Custom hook for fetching jobs
export function useJobs(params: FetchJobsParams = {}) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["jobs", params],
    queryFn: async () => {
      const token = await getToken({ template: "remote-job-radar" });
      return fetchJobsClient(params, token || undefined);
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    enabled: true, // Always enabled for now, you can add auth checks here
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
      // Invalidate and refetch jobs query
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error) => {
      console.error("Bookmark mutation error:", error);
    },
  });
}

// Helper hook to get optimistic updates for bookmarks
export function useOptimisticBookmark() {
  const queryClient = useQueryClient();

  const updateBookmarkOptimistically = (jobId: string, bookmarked: boolean) => {
    queryClient.setQueriesData<{ jobs: Job[] }>(
      { queryKey: ["jobs"] },
      (old) => {
        if (!old) return old;
        return {
          jobs: old.jobs.map((job) =>
            job.id === jobId ? { ...job, bookmarked } : job
          ),
        };
      }
    );
  };

  const revertBookmarkOptimistically = (jobId: string, bookmarked: boolean) => {
    queryClient.setQueriesData<{ jobs: Job[] }>(
      { queryKey: ["jobs"] },
      (old) => {
        if (!old) return old;
        return {
          jobs: old.jobs.map((job) =>
            job.id === jobId ? { ...job, bookmarked } : job
          ),
        };
      }
    );
  };

  return { updateBookmarkOptimistically, revertBookmarkOptimistically };
}
