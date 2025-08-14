import { fetchJobs } from "../../lib/gqlClient";
import { JobsPageClient } from "../../components/JobsPageClient";
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";

// Server component that prefetches data
export default async function JobsPageServer() {
  const queryClient = new QueryClient();

  // Prefetch jobs data on the server
  await queryClient.prefetchQuery({
    queryKey: ["jobs", { minFit: 1, first: 10 }],
    queryFn: () => fetchJobs({ minFit: 1, first: 10 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JobsPageClient />
    </HydrationBoundary>
  );
}
