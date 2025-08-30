import { NextResponse } from "next/server";

import { WEB_URL } from "@/constants";

export async function GET(): Promise<NextResponse> {
  const healthUrls = [
    "/api/health/aggregator", // Aggregator health route
    "/api/health/db", // Database health route
    "/api/health/embedder", // Embedder health route
    "/api/health/graphql", // GraphQL health route
    "/api/health/web", // Web health route
  ];

  const healthChecks = await Promise.all(
    healthUrls.map(async (url) => {
      try {
        const response = await fetch(WEB_URL + url);
        if (!response.ok) {
          throw new Error(`Service at ${url} returned status ${response.status}`);
        }
        return { url, status: "healthy" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { url, status: "unhealthy", error: errorMessage };
      }
    }),
  );

  return NextResponse.json({ services: healthChecks }, { status: 200 });
}
