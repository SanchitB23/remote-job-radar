import { HealthResponse } from "@/types/api/health";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse<HealthResponse>> {
  // You can add any custom logic here, e.g. check DB, call other services, etc.
  return NextResponse.json(
    { ok: true, timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
