import { NextResponse } from "next/server";
import { HealthResponse } from "@/types/api/health";

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const apiUrl =
    process.env.EMBEDDER_SERVER_BASE_URL || "http://localhost:1234";
  try {
    const res = await fetch(apiUrl + "/health");
    const data = (await res.json()) as HealthResponse;
    return NextResponse.json(
      { ...data, timestamp: new Date().toISOString() },
      { status: res.status }
    );
  } catch (error) {
    console.error("Error fetching health status:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
