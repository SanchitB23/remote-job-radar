import { auth } from "@clerk/nextjs/server";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import type { JSX } from "react";

import { FilterSidebar } from "@/app/jobs/FilterSidebar";
import { fetchFilterMetadataShared, fetchJobsShared } from "@/services/gql-api";

import { JobsPageClient } from "./JobsPageClient";
import { parseUrlJobParams } from "./utils";

// Server component that prefetches data
export default async function JobsPageServer({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<JSX.Element> {
  const sp = await searchParams;
  const urlSearchParams = new URLSearchParams(
    Object.entries(sp).flatMap(([key, value]) =>
      Array.isArray(value) ? value.map((v) => [key, v]) : value !== undefined ? [[key, value]] : [],
    ),
  );
  const params = parseUrlJobParams(urlSearchParams);

  const queryClient = new QueryClient();
  const authResult = await auth();
  const getToken = authResult?.getToken;
  const token = getToken ? await getToken({ template: "remote-job-radar" }) : undefined;

  // Remove 'after' from params since it's handled by infinite query

  const { after: _, ...infiniteParams } = params;

  // Prefetch the first page of infinite query
  await queryClient.prefetchInfiniteQuery({
    queryKey: ["jobs-infinite", infiniteParams],
    queryFn: async () => {
      return await fetchJobsShared(infiniteParams, token || "");
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: { hasNextPage: boolean; endCursor?: string }) => {
      return lastPage.hasNextPage ? lastPage.endCursor : undefined;
    },
  });

  await queryClient.prefetchQuery({
    queryKey: ["filter-metadata"],
    queryFn: async () => {
      return await fetchFilterMetadataShared(token || "");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        <div className="lg:col-span-1 lg:sticky lg:top-4">
          <FilterSidebar />
        </div>
        <div className="lg:col-span-3">
          <JobsPageClient />
        </div>
      </div>
    </HydrationBoundary>
  );
}
