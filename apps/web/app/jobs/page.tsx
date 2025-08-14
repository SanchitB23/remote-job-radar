import { auth } from "@clerk/nextjs/server";
import { JobsPageClient } from "./JobsPageClient";
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { getParamsFromUrl } from "./utils";
import { fetchJobsShared } from "@/lib/shared-gql";

// Server component that prefetches data
export default async function JobsPageServer({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
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

  await queryClient.prefetchQuery({
    queryKey: ["jobs", params],
    queryFn: async () => {
      const jobsConnection = await fetchJobsShared(params, token || "");
      return {
        jobs: Array.isArray(jobsConnection?.edges) ? jobsConnection.edges : [],
      };
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JobsPageClient />
    </HydrationBoundary>
  );
}
