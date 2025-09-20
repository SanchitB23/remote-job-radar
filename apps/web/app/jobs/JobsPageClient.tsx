"use client";

import type { InfiniteData } from "@tanstack/react-query";
import { Info, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";

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

  // Helper text dismissible functionality
  const [isHelperDismissed, setIsHelperDismissed] = useState(false);

  // Load dismissed state from localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem("skills-helper-dismissed");
    if (dismissed === "true") {
      setIsHelperDismissed(true);
    }
  }, []);

  const dismissHelper = useCallback(() => {
    setIsHelperDismissed(true);
    localStorage.setItem("skills-helper-dismissed", "true");
  }, []);

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
        {/* Prompt to add skills if none are found */}
        {!isLoadingUserSkills &&
          !isErrorUserSkills &&
          !isHelperDismissed &&
          (!userSkills?.skills || userSkills.skills.length === 0) && (
            <div className="group relative flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/80 dark:via-indigo-950/60 dark:to-purple-950/80 rounded-xl border border-blue-200/60 dark:border-blue-800/60 shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in-0 slide-in-from-top-2">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-400/5 dark:via-indigo-400/5 dark:to-purple-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Icon with pulse animation */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse" />
                <Info className="relative w-5 h-5 text-blue-600 dark:text-blue-400 animate-in zoom-in-0 duration-300" />
              </div>

              {/* Enhanced text with gradient */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent leading-relaxed">
                  ✨ Add your skills to unlock personalized job recommendations and better matches
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="relative h-8 px-4 text-xs font-medium bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Link href="/user-profile/personalization">
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Add Skills
                  </Link>
                </Button>

                {/* Dismiss button */}
                <Button
                  onClick={dismissHelper}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors duration-200"
                  aria-label="Dismiss helper"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
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
