import { FetchJobsParams } from "@/types/gql";


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
    sources: (() => {
      const all = searchParams.getAll("sources");
      if (all.length > 0) return all;
      const single = searchParams.get("sources");
      if (single) return single.split(",");
      return undefined;
    })(),
    sortBy: searchParams.get("sortBy") || undefined,
    after: searchParams.get("after") || undefined,
  };
}
