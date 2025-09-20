import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AGGREGATOR_URL, CRON_SECRET, MANUAL_FETCH_TOKEN_CRON } from "@/constants";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 200) : 25;

  const cronSecret = req.headers.get("X-Cron-Secret");
  const validToken = MANUAL_FETCH_TOKEN_CRON && token === MANUAL_FETCH_TOKEN_CRON;
  const validCronSecret = CRON_SECRET && cronSecret === CRON_SECRET;

  if (!validToken && !validCronSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing or invalid token or X-Cron-Secret header",
        message: "Authorization required",
      },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${AGGREGATOR_URL}/embed-pending-skills?limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cronSecret ? { "X-Cron-Secret": cronSecret } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        {
          ok: false,
          error: error.error || "Failed to process pending skills",
          message: error.message || "An error occurred while processing pending skills",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
