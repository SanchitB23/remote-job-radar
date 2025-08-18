"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";
import type { Job, JobsConnection } from "@/types/gql";

import { useInfiniteJobs } from "../../lib/hooks";
import { JobCard } from "./JobCard";
import { JobCardSkeleton } from "./JobCardSkeleton";
import { JobsError } from "./JobsError";
import { parseUrlJobParams } from "./utils";

export function JobsPageClient(): JSX.Element {
  const searchParams = useSearchParams();
  const params = parseUrlJobParams(searchParams);

  // Remove 'after' param before passing to useInfiniteJobs - using underscore prefix to indicate intentionally unused
  const { after: _after, ...infiniteParams } = params;

  const { data, isLoading, isFetching, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteJobs(infiniteParams);

  // Flatten all jobs from all pages
  const jobs: Job[] =
    (data as InfiniteData<JobsConnection> | undefined)?.pages.flatMap((page) => page.edges) || [];

  // Smart loading state: show skeletons for filter changes, not pagination
  const isFilterLoading = isFetching && !isFetchingNextPage && !isLoading;

  // Load more jobs when user scrolls to bottom
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Infinite scroll effect with throttling to improve performance
  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledHandleScroll = (): void => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        if (
          window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 1000 // Load when 1000px from bottom
        ) {
          handleLoadMore();
        }
      }, 200);
    };
    window.addEventListener("scroll", throttledHandleScroll);
    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [handleLoadMore]);

  if (error) {
    return <JobsError error={error} />;
  }

  if (isLoading || isFilterLoading) {
    // Show skeleton cards for initial load or filter changes
    return (
      <ul className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </ul>
    );
  }

  return (
    <div>
      {/* Jobs info header */}
      {jobs.length > 0 && (
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          {hasNextPage && " (loading more as you scroll)"}
        </div>
      )}

      <ul className="space-y-2">
        {jobs.map((j: Job) => (
          <li key={j.id}>
            <JobCard j={j} />
          </li>
        ))}
      </ul>

      {/* Loading indicator for next page */}
      {isFetchingNextPage && (
        <div className="mt-4">
          <ul className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <JobCardSkeleton key={`loading-${i}`} />
            ))}
          </ul>
        </div>
      )}

      {/* Load more button as fallback */}
      {hasNextPage && !isFetchingNextPage && (
        <div className="mt-6 text-center">
          <Button onClick={handleLoadMore} className="px-6 py-2">
            Load More Jobs
          </Button>
        </div>
      )}

      {/* End of results indicator */}
      {!hasNextPage && jobs.length > 0 && (
        <div className="mt-6 text-center text-gray-500 text-sm">
          You&apos;ve reached the end of the job listings.
        </div>
      )}

      {/* No jobs found */}
      {!isLoading && jobs.length === 0 && (
        <div className="text-center py-12">
          <div className="rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto flex items-center justify-center text-3xl text-gray-400">
            📋
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-semibold">No jobs found</p>
          <p className="mt-2 text-gray-500 text-sm">
            Try adjusting your filters to see more results.
          </p>
        </div>
      )}
    </div>
  );
}
