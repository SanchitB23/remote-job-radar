"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  fetchJobsClient,
  fetchJobsConnectionClient,
  toggleBookmarkClient,
} from "./gqlClient.client";
import { FetchJobsParams, Job, JobsConnection } from "./shared-gql";

// Custom hook for fetching jobs (non-paginated - for backward compatibility)
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

// Helper hook to get optimistic updates for bookmarks
export function useOptimisticBookmark() {
  const queryClient = useQueryClient();

  // Shared helper to update infinite jobs query data
  const updateInfiniteJobsBookmark = (jobId: string, bookmarked: boolean) => (
    old:
      | { pages: JobsConnection[]; pageParams: (string | undefined)[] }
      | undefined
  ) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page: JobsConnection) => ({
        ...page,
        edges: page.edges.map((job) =>
          job.id === jobId ? { ...job, bookmarked } : job
        ),
      })),
    };
  };

  const updateBookmarkOptimistically = (jobId: string, bookmarked: boolean) => {
    // Update regular jobs query
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

    // Update infinite jobs query using shared helper
    queryClient.setQueriesData(
      { queryKey: ["jobs-infinite"] },
      updateInfiniteJobsBookmark(jobId, bookmarked)
    );
  };

  const revertBookmarkOptimistically = (jobId: string, bookmarked: boolean) => {
    // Revert regular jobs query
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

    // Revert infinite jobs query using shared helper
    queryClient.setQueriesData(
      { queryKey: ["jobs-infinite"] },
      updateInfiniteJobsBookmark(jobId, bookmarked)
    );
  };

  return { updateBookmarkOptimistically, revertBookmarkOptimistically };
}
