import { type NextRequest, NextResponse } from "next/server";

// Optionally, use an env var for a secret to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;
const AGGREGATOR_URL = process.env.CRON_SERVER_BASE_URL || "http://localhost:8080";

export async function POST(req: NextRequest): Promise<ReturnType<typeof NextResponse.json>> {
  // Simple secret check (header or query param)
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const aggregatorRes = await fetch(`${AGGREGATOR_URL}/api/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await aggregatorRes.json();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to trigger aggregator", details: String(err) },
      { status: 500 },
    );
  }
}
