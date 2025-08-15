import { HealthResponse } from "@/types/api/health";
import { NextResponse } from "next/server";

export async function GET() {
  const cronUrl = process.env.CRON_SERVER_BASE_URL || "http://localhost:4000";
  const gqlUrl = process.env.GRAPHQL_SERVER_BASE_URL || "http://localhost:4000";

  const fetchHealth = async (
    baseUrl: string,
    path = "/health/db"
  ): Promise<HealthResponse & { status: number }> => {
    try {
      const res = await fetch(baseUrl + path);
      const data = (await res.json()) as HealthResponse;
      return {
        ...data,
        status: res.status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        status: 503,
      };
    }
  };

  // Race both endpoints, return the first one that resolves
  const result = await Promise.race([
    fetchHealth(cronUrl),
    fetchHealth(gqlUrl),
  ]);
  const { status, ...rest } = result;
  return NextResponse.json({ ...rest }, { status });
}
