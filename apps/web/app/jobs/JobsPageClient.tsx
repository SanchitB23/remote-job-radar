"use client";

import FilterSidebar from "@/components/filterSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { BookmarkButton } from "../../components/bookmarkBtn";

import { useJobs } from "../../lib/hooks";
import { getParamsFromUrl } from "./utils";
import { Job } from "@/lib/shared-gql";

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

  const { data } = useJobs(params);
  const jobs: Job[] = data?.jobs || [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
      {/* Sidebar on top for mobile, left for desktop */}
      <div className="lg:col-span-1 lg:sticky lg:top-4">
        <FilterSidebar />
      </div>
      <div className="lg:col-span-3">
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
                  <p className="text-gray-600 dark:text-zinc-300">
                    {j.company}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Fit Score: {Math.round(j.fitScore)}%
                  </p>
                </div>
                <div>
                  <span className="ml-2 z-20 pointer-events-auto">
                    <BookmarkButton
                      id={j.id}
                      bookmarked={j.bookmarked ?? false}
                    />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
