"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useInfiniteJobs, useUserSkills } from "@/lib/hooks";
import type { Job, JobsConnection } from "@/types/gql";

import { JobCard } from "./JobCard";
import { JobCardSkeleton } from "./JobCardSkeleton";
import { parseUrlJobParams } from "./utils";

function JobsError({ error }: { error: unknown }): JSX.Element {
  return (
    <div className="text-center py-12">
      <div className="rounded-full h-12 w-12 border-b-2 border-destructive mx-auto flex items-center justify-center text-3xl text-destructive">
        !
      </div>
      <p className="mt-4 text-destructive font-semibold">Failed to load jobs.</p>
      <p className="mt-2 text-muted-foreground text-sm">
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

  const {
    data: userSkills,
    isLoading: isLoadingUserSkills,
    isError: isErrorUserSkills,
  } = useUserSkills();

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

  const renderPersonalizedChip = (): JSX.Element | null =>
    !isLoadingUserSkills &&
    !isErrorUserSkills &&
    userSkills?.skills &&
    userSkills.skills.length > 0 ? (
      <span className="ml-3 inline-flex items-center rounded-full bg-chart-4/10 px-3 py-1 text-xs font-medium text-chart-4 border border-chart-4/20 shadow-sm">
        <svg
          className="w-3.5 h-3.5 mr-1.5 text-chart-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M10 2a1 1 0 0 1 .894.553l2.382 4.83 5.334.775a1 1 0 0 1 .554 1.707l-3.858 3.762.911 5.312a1 1 0 0 1-1.451 1.054L10 16.347l-4.768 2.506a1 1 0 0 1-1.451-1.054l.911-5.312L.834 9.865a1 1 0 0 1 .554-1.707l5.334-.775L9.106 2.553A1 1 0 0 1 10 2Z" />
        </svg>
        Personalized
      </span>
    ) : null;

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
      <div className="flex items-center gap-3 mb-2 text-sm text-muted-foreground">
        {renderPersonalizedChip()}
        {jobs.length > 0 && (
          <span>
            Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
            {hasNextPage && " (loading more as you scroll)"}
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {jobs.map((j: Job) => (
          <li key={j.id}>
            <JobCard job={j} />
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
        <div className="mt-6 text-center text-muted-foreground text-sm">
          You&apos;ve reached the end of the job listings.
        </div>
      )}

      {/* No jobs found */}
      {!isLoading && jobs.length === 0 && (
        <div className="text-center py-12">
          <div className="rounded-full h-12 w-12 border-b-2 border-muted mx-auto flex items-center justify-center text-3xl text-muted-foreground">
            📋
          </div>
          <p className="mt-4 text-muted-foreground font-semibold">No jobs found</p>
          <p className="mt-2 text-muted-foreground text-sm">
            Try adjusting your filters to see more results.
          </p>
        </div>
      )}
    </div>
  );
}
