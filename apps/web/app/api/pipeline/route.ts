import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  fetchPipelineShared,
  upsertPipelineItemShared,
} from "@/services/gql-api";

export async function GET() {
  try {
    // Get authentication token
    const { getToken } = await auth();
    const token = await getToken({ template: "remote-job-radar" });

    // Call the GraphQL backend
    const result = await fetchPipelineShared(token);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching pipeline:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch pipeline",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication token
    const { getToken } = await auth();
    const token = await getToken({ template: "remote-job-radar" });

    // Parse request body
    const { jobId, column, position } = await request.json();

    if (!jobId || !column || position === undefined) {
      return NextResponse.json(
        { error: "Job ID, column, and position are required" },
        { status: 400 }
      );
    }

    // Call the GraphQL backend
    const result = await upsertPipelineItemShared(
      jobId,
      column,
      position,
      token
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error upserting pipeline item:", error);
    return NextResponse.json(
      {
        error: "Failed to upsert pipeline item",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
