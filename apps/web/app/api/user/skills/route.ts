import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { fetchUserSkills, saveUserSkills } from "@/services/gql-api";

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

export async function PUT(request: Request): Promise<NextResponse> {
  // Get authentication token
  const { getToken } = await auth();
  const token = await getToken({ template: "remote-job-radar" });

  try {
    const skills = await request.json();
    console.debug("[PUT /api/user/skills] Saving user skills:", skills);

    await saveUserSkills(token, skills);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/user/skills] Error saving user skills:", error);
    return NextResponse.json({ error: "Failed to save user skills" }, { status: 500 });
  }
}
