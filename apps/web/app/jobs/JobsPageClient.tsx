"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { useCallback, useEffect } from "react";

import type { Job, JobsConnection } from "@/types/gql";

import { useInfiniteJobs } from "../../lib/hooks";
import { AddToPipelineButton } from "./AddToPipelineBtn";
import { BookmarkButton } from "./BookmarkBtn";
import { JobCardSkeleton } from "./JobCardSkeleton";
import { parseUrlJobParams } from "./utils";

function JobsError({ error }: { error: unknown }): JSX.Element {
  return (
    <div className="text-center py-12">
      <div className="rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto flex items-center justify-center text-3xl text-red-600">
        !
      </div>
      <p className="mt-4 text-red-600 dark:text-red-400 font-semibold">Failed to load jobs.</p>
      <p className="mt-2 text-gray-500 text-sm">
        {error instanceof Error ? error.message : "An unknown error occurred."}
      </p>
    </div>
  );
}

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
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          {hasNextPage && " (loading more as you scroll)"}
        </div>
      )}

      <ul className="space-y-2">
        {jobs.map((j: Job) => (
          <li
            key={j.id}
            className="relative border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer group"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("[data-bookmark-btn]")) return;
              window.open(j.url, "_blank", "noopener");
            }}
            tabIndex={0}
            role="button"
            aria-label={j.title}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const target = e.target as HTMLElement;
                if (target.closest("[data-bookmark-btn]")) return;
                window.open(j.url, "_blank", "noopener");
              }
            }}
          >
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                  {j.title}
                </h3>
                <p className="text-gray-600 dark:text-zinc-300">{j.company}</p>
                <p
                  className={
                    "text-sm " +
                    (j.fitScore === 0
                      ? "text-gray-400 dark:text-gray-500"
                      : "text-green-600 dark:text-green-400")
                  }
                >
                  Fit Score: {j.fitScore === 0 ? "N/A" : `${Math.round(j.fitScore)}%`}
                </p>
              </div>
              <span className="ml-2 z-20 pointer-events-auto flex gap-2" data-bookmark-btn>
                <span title={j.bookmarked ? "Remove bookmark" : "Bookmark this job"}>
                  <BookmarkButton id={j.id} bookmarked={j.bookmarked ?? false} />
                </span>
                <span title="Add to Pipeline (Wishlist)">
                  <AddToPipelineButton jobId={j.id} inPipeline={j.isTracked} />
                </span>
              </span>
            </div>
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
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More Jobs
          </button>
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
