/*
 * DISABLED CRON JOB - NOT CONFIGURED IN VERCEL
 *
 * This endpoint is not set up as a cron job due to Vercel free tier limitations.
 * Vercel free plans allow only 2 cron jobs maximum, and we've reached that limit.
 *
 * The functionality provided by this endpoint (cleaning old job data) should be
 * handled by the aggregator service which has its own cleanup mechanisms.
 *
 * This route remains available for manual triggering if needed, but is not
 * automatically scheduled via Vercel cron jobs.
 */

import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;
const AGGREGATOR_URL = process.env.CRON_SERVER_BASE_URL || "http://localhost:8080";

export async function DELETE(req: Request): Promise<ReturnType<typeof NextResponse.json>> {
  const requestSecret = req.headers.get("x-cron-secret");

  if (!requestSecret || requestSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized: Invalid CRON Secret" }, { status: 401 });
  }

  try {
    const aggregatorRes = await fetch(`${AGGREGATOR_URL}/clean`, {
      method: "DELETE",
      headers: {
        "x-cron-secret": CRON_SECRET ?? "",
      },
    });
    const data = await aggregatorRes.json();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to trigger aggregator clean", details: String(err) },
      { status: 500 },
    );
  }
}
