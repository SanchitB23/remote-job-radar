import { FetchJobsParams } from "@/lib/shared-gql";

export function getParamsFromUrl(
  searchParams: URLSearchParams
): FetchJobsParams {
  return {
    minFit: searchParams.get("minFit")
      ? Number(searchParams.get("minFit"))
      : undefined,
    first: searchParams.get("first")
      ? Number(searchParams.get("first"))
      : undefined,
    search: searchParams.get("search") || undefined,
    minSalary: searchParams.get("minSalary")
      ? Number(searchParams.get("minSalary"))
      : undefined,
    location: searchParams.get("location") || undefined,
    sources: searchParams.get("sources")
      ? searchParams.get("sources")!.split(",")
      : undefined,
    sortBy: searchParams.get("sortBy") || undefined,
    after: searchParams.get("after") || undefined,
  };
}
