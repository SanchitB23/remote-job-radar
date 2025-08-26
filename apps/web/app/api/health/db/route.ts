import { NextResponse } from "next/server";

import { GRAPHQL_BASE_URL } from "@/constants";
import type { HealthResponse } from "@/types/api/health";

/**
  // The fallback URLs for cronUrl and gqlUrl are intentionally identical.
  const cronUrl = process.env.CRON_SERVER_BASE_URL || "http://localhost:4000";
  const gqlUrl = GRAPHQL_BASE_URL;
 * @returns {object} JSON response with the following shape:
 * {
 *   ok: boolean,
 *   error?: string,
 *   timestamp: string,
 *   status: number
 * }
 */
export async function GET(): Promise<NextResponse> {
  try {
    const cronUrl = process.env.CRON_SERVER_BASE_URL || "http://localhost:4000";
    const gqlUrl = GRAPHQL_BASE_URL;
    const timestamp = new Date().toISOString();

    // Return the first successful health check, or error if all fail
    const result = await Promise.any([
      fetchHealth(cronUrl, "/health/db", 5000, timestamp),
      fetchHealth(gqlUrl, "/health/db", 5000, timestamp),
    ]);

    const { status, ...rest } = result;
    return NextResponse.json({ ...rest }, { status });
  } catch (error) {
    // If all health checks fail, Promise.any throws an AggregateError
    let errorMsg = "All health checks failed";
    if (error instanceof AggregateError && error.errors?.length) {
      errorMsg = error.errors
        .map((e: unknown) => {
          if (typeof e === "object" && e !== null && "error" in e) {
            return (e as { error: string }).error;
          }
          if (typeof e === "object" && e !== null && "message" in e) {
            return (e as { message: string }).message;
          }
          return String(e);
        })
        .join("; ");
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json(
      {
        ok: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
        status: 503,
      },
      { status: 503 },
    );
  }
}

const fetchHealth = async (
  baseUrl: string,
  path = "/health/db",
  timeout = 5000, // 5 seconds timeout
  timestamp: string,
): Promise<HealthResponse & { status: number }> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(baseUrl + path, { signal: controller.signal });
    clearTimeout(timer);
    const data = (await res.json()) as HealthResponse;
    return {
      ...data,
      status: res.status,
      timestamp,
    };
  } catch (error) {
    clearTimeout(timer);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp,
      status: 503,
    };
  }
};
