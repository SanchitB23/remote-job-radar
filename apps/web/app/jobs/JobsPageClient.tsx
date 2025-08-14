"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { BookmarkButton } from "../../components/bookmarkBtn";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useJobs } from "../../lib/hooks";
import type { Job } from "../../lib/gqlClient.client";
import FilterSidebar from "@/components/filterSidebar";

export function JobsPageClient() {
  const { data, isLoading, error } = useJobs({ minFit: 1, first: 10 });

  const jobs: Job[] = data?.jobs || [];
  console.log("Jobs:", jobs);
  return (
    <>
      <SignedOut>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">
            Welcome to Remote Job Radar
          </h1>
          <p className="mb-6">
            Sign in to view personalized job recommendations
          </p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
              Sign In to View Jobs
            </button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <div>
          <h1 className="text-2xl font-bold mb-6">Your Job Recommendations</h1>

          {isLoading ? (
            <LoadingSpinner message="Loading jobs..." />
          ) : error ? (
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Unable to load jobs</h1>
              <p className="text-gray-600">
                {error instanceof Error
                  ? error.message
                  : "Unable to load jobs. Please make sure the API server is running."}
              </p>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {jobs.map((j: Job) => (
                  <li
                    key={j.id}
                    className="border p-4 rounded-lg hover:bg-gray-50"
                  >
                    <a href={j.url} target="_blank" className="block">
                      <h3 className="font-semibold text-lg">{j.title}</h3>
                      <p className="text-gray-600">{j.company}</p>
                      <p className="text-sm text-green-600">
                        Fit Score: {Math.round(j.fitScore)}%
                      </p>
                    </a>
                    <BookmarkButton
                      id={j.id}
                      bookmarked={j.bookmarked ?? false}
                    />
                  </li>
                ))}
              </ul>
              <FilterSidebar />
            </>
          )}
        </div>
      </SignedIn>
    </>
  );
}
