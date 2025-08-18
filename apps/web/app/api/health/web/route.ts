import { NextResponse } from "next/server";

import type { HealthResponse } from "@/types/api/health";

export async function GET(): Promise<NextResponse<HealthResponse>> {
  // You can add any custom logic here, e.g. check DB, call other services, etc.
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() }, { status: 200 });
}
