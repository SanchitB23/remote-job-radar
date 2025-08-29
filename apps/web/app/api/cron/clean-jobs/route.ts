import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;
const AGGREGATOR_URL = process.env.CRON_SERVER_BASE_URL || "http://localhost:8080";

export async function DELETE(): Promise<ReturnType<typeof NextResponse.json>> {
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
