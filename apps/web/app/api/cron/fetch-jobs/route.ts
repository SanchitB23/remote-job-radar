import { NextResponse } from "next/server";

import { AGGREGATOR_URL, CRON_SECRET } from "@/constants";

export async function POST(request: Request): Promise<ReturnType<typeof NextResponse.json>> {
  const { headers } = request;
  const requestSecret = headers.get("x-cron-secret");

  if (!requestSecret || requestSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized: Invalid CRON Secret" }, { status: 401 });
  }

  try {
    const aggregatorRes = await fetch(`${AGGREGATOR_URL}/fetch`, {
      method: "POST",
      headers: {
        "x-cron-secret": CRON_SECRET ?? "",
      },
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
