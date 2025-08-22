import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { fetchUserSkills } from "@/services/gql-api";

export async function GET(): Promise<NextResponse> {
  // Get authentication token
  const { getToken } = await auth();
  const token = await getToken({ template: "remote-job-radar" });

  try {
    const skills = await fetchUserSkills(token);

    return NextResponse.json(skills);
  } catch (error) {
    console.error("[GET /api/user/skills] Error fetching user skills:", error);
    return NextResponse.json({ error: "Failed to fetch user skills" }, { status: 500 });
  }
}
