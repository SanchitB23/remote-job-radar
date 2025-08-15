import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { toggleBookmarkShared } from "@/services/gql-api";

export async function POST(request: NextRequest) {
  try {
    // Get authentication token
    const { getToken } = await auth();
    const token = await getToken({ template: "remote-job-radar" });

    // Parse request body
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Call the GraphQL backend
    const result = await toggleBookmarkShared(jobId, token);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json(
      {
        error: "Failed to toggle bookmark",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
