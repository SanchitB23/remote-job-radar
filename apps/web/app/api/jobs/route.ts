import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchJobsShared } from "@/services/gql-api";
import { FetchJobsParams } from "@/types/gql";

export async function GET(request: NextRequest) {
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
    if (searchParams.get("location")) {
      params.location = searchParams.get("location")!;
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
      { status: 500 }
    );
  }
}
