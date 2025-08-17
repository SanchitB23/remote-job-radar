import { FetchJobsParams } from "@/types/gql";

/**
 * Parses a URLSearchParams object and extracts job-related query parameters,
 * converting them into a strongly-typed FetchJobsParams object.
 *
 * Handles conversion of numeric values, optional parameters, and supports
 * multiple values for certain keys (e.g., workType, sources).
 *
 * @param searchParams - The URLSearchParams instance containing query parameters.
 * @returns A FetchJobsParams object with the extracted and parsed parameters.
 */
export function parseUrlJobParams(
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
    workType: (() => {
      const all = searchParams.getAll("workType");
      if (all.length > 0) return all.join(","); // Join multiple work types with comma
      return searchParams.get("workType") || undefined;
    })(),
    sources: (() => {
      const all = searchParams.getAll("sources");
      if (all.length > 0) return all;
      const single = searchParams.get("sources");
      if (single) return single.split(",");
      return undefined;
    })(),
    sortBy: searchParams.get("sortBy") || undefined,
    after: searchParams.get("after") || undefined,
    bookmarked: (() => {
      const param = searchParams.get("bookmarked");
      return param === "true" ? true : param === "false" ? false : null;
    })(),
    isTracked: (() => {
      const param = searchParams.get("isTracked");
      return param === "true" ? true : param === "false" ? false : null;
    })(),
  };
}
