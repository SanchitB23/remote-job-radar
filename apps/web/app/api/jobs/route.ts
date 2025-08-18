import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { fetchJobsShared } from "@/services/gql-api";
import type { FetchJobsParams } from "@/types/gql";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authentication token
    const { getToken } = await auth();
    const token = await getToken({ template: "remote-job-radar" });

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const params: FetchJobsParams = {};

    // Parse numerical parameters
    if (searchParams.get("minFit")) {
      params.minFit = parseFloat(searchParams.get("minFit")!);
    }
    if (searchParams.get("first")) {
      params.first = parseInt(searchParams.get("first")!);
    }
    if (searchParams.get("minSalary")) {
      params.minSalary = parseInt(searchParams.get("minSalary")!);
    }

    // Parse string parameters
    if (searchParams.get("search")) {
      params.search = searchParams.get("search")!;
    }
    if (searchParams.get("workType")) {
      params.workType = searchParams.get("workType")!;
    }
    if (searchParams.get("sortBy")) {
      params.sortBy = searchParams.get("sortBy")!;
    }
    if (searchParams.get("after")) {
      params.after = searchParams.get("after")!;
    }

    // Parse array parameters
    if (searchParams.get("sources")) {
      params.sources = searchParams.get("sources")!.split(",");
    }

    // Parse filter parameters for bookmarks and tracking
    const bookmarkedParam = searchParams.get("bookmarked");
    if (bookmarkedParam !== null) {
      params.bookmarked =
        bookmarkedParam === "true" ? true : bookmarkedParam === "false" ? false : null;
    }

    const isTrackedParam = searchParams.get("isTracked");
    if (isTrackedParam !== null) {
      params.isTracked =
        isTrackedParam === "true" ? true : isTrackedParam === "false" ? false : null;
    }

    // Call the GraphQL backend
    const result = await fetchJobsShared(params, token);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch jobs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
