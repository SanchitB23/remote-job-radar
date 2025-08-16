import { HealthResponse } from "@/types/api/health";
import { NextResponse } from "next/server";

/**
  // The fallback URLs for cronUrl and gqlUrl are intentionally identical.
  const cronUrl = process.env.CRON_SERVER_BASE_URL || "http://localhost:4000";
  const gqlUrl = process.env.GRAPHQL_SERVER_BASE_URL || "http://localhost:4000";
 * @returns {object} JSON response with the following shape:
 * {
 *   ok: boolean,
 *   error?: string,
 *   timestamp: string,
 *   status: number
 * }
 */
export async function GET() {
  const cronUrl = process.env.CRON_SERVER_BASE_URL || "http://localhost:4000";
  const gqlUrl = process.env.GRAPHQL_SERVER_BASE_URL || "http://localhost:4000";
  const timestamp = new Date().toISOString();

  // Wait for the first successful (ok: true) response, or return the last error if all fail
  const results = await Promise.allSettled([
    fetchHealth(cronUrl, "/health/db", 5000, timestamp),
    fetchHealth(gqlUrl, "/health/db", 5000, timestamp),
  ]);

  const success = results.find(
    (r): r is PromiseFulfilledResult<HealthResponse & { status: number }> =>
      isFulfilled(r) && r.value.ok
  );

  const result =
    success?.value ||
    (results.find(isFulfilled)?.value ?? {
      ok: false,
      error: "All health checks failed",
      timestamp: new Date().toISOString(),
      status: 503,
    });

  const { status, ...rest } = result;
  return NextResponse.json({ ...rest }, { status });
}

const fetchHealth = async (
  baseUrl: string,
  path = "/health/db",
  timeout = 5000, // 5 seconds timeout
  timestamp: string
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

const isFulfilled = (
  r: PromiseSettledResult<HealthResponse & { status: number }>
): r is PromiseFulfilledResult<HealthResponse & { status: number }> =>
  r.status === "fulfilled";
