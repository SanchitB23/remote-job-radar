"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { BookmarkButton } from "../../components/bookmarkBtn";

import { useJobs } from "../../lib/hooks";
import { getParamsFromUrl } from "./utils";

import JobCardSkeleton from "./JobCardSkeleton";
import { Job } from "@/lib/shared-gql";

function JobsError({ error }: { error: unknown }) {
  return (
    <div className="text-center py-12">
      <div className="rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto flex items-center justify-center text-3xl text-red-600">
        !
      </div>
      <p className="mt-4 text-red-600 dark:text-red-400 font-semibold">
        Failed to load jobs.
      </p>
      <p className="mt-2 text-gray-500 text-sm">
        {error instanceof Error ? error.message : "An unknown error occurred."}
      </p>
    </div>
  );
}

export function JobsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = getParamsFromUrl(searchParams);

  // On first mount, update URL params if missing (set all defaults from FetchJobsParams)
  useEffect(() => {
    const url = new URL(window.location.href);
    let changed = false;
    if (!url.searchParams.get("minFit")) {
      url.searchParams.set("minFit", "1");
      changed = true;
    }
    if (!url.searchParams.get("first")) {
      url.searchParams.set("first", "10");
      changed = true;
    }
    // Add more defaults here if needed, e.g.:
    // if (!url.searchParams.get("sortBy")) { url.searchParams.set("sortBy", "relevance"); changed = true; }
    if (changed) {
      router.replace(url.pathname + "?" + url.searchParams.toString());
    }
  }, [router]);

  const { data, isLoading, isFetching, error } = useJobs(params);
  const jobs: Job[] = data?.jobs || [];

  if (error) {
    return <JobsError error={error} />;
  }
  if (isLoading || isFetching) {
    // Show 6 skeleton cards to mimic job list
    return (
      <ul className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-2">
      {jobs.map((j: Job) => (
        <li
          key={j.id}
          className="relative border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer group"
        >
          {/* Full-card clickable link, except for the bookmark button */}
          <a
            href={j.url}
            target="_blank"
            className="absolute inset-0 z-0 rounded-lg pointer-events-auto"
            tabIndex={-1}
            aria-label={j.title}
          />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                {j.title}
              </h3>
              <p className="text-gray-600 dark:text-zinc-300">{j.company}</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Fit Score: {Math.round(j.fitScore)}%
              </p>
            </div>
            <div>
              <span className="ml-2 z-20 pointer-events-auto">
                <BookmarkButton id={j.id} bookmarked={j.bookmarked ?? false} />
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
