import { auth } from "@clerk/nextjs/server";

import FilterSidebar from "@/components/filterSidebar";
import { JobsPageClient } from "./JobsPageClient";
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { getParamsFromUrl } from "./utils";
import { fetchJobsShared } from "@/services/gql-api";

// Server component that prefetches data
export default async function JobsPageServer({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const urlSearchParams = new URLSearchParams(
    Object.entries(sp).flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map((v) => [key, v])
        : value !== undefined
        ? [[key, value]]
        : []
    )
  );
  const params = getParamsFromUrl(urlSearchParams);

  const queryClient = new QueryClient();
  const authResult = await auth();
  const getToken = authResult?.getToken;
  const token = getToken
    ? await getToken({ template: "remote-job-radar" })
    : undefined;

  // Remove 'after' from params since it's handled by infinite query
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { after: _, ...infiniteParams } = params;

  // Prefetch the first page of infinite query
  await queryClient.prefetchInfiniteQuery({
    queryKey: ["jobs-infinite", infiniteParams],
    queryFn: async () => {
      return await fetchJobsShared(infiniteParams, token || "");
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: {
      hasNextPage: boolean;
      endCursor?: string;
    }) => {
      return lastPage.hasNextPage ? lastPage.endCursor : undefined;
    },
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
