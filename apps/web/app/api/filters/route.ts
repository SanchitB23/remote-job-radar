import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeGraphQLQuery } from "@/services/gql-api";
import { FilterMetadata } from "@/types/gql";
import { FILTER_METADATA_QUERY } from "@/constants/gqlQueries";

export async function GET() {
  try {
    // Get authentication token
    const { getToken } = await auth();
    const token = await getToken({ template: "remote-job-radar" });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await executeGraphQLQuery<{
      filterMetadata: FilterMetadata;
    }>(FILTER_METADATA_QUERY, {}, token);

    return NextResponse.json(result.filterMetadata);
  } catch (error) {
    console.error("Error fetching filter metadata:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch filter metadata",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
