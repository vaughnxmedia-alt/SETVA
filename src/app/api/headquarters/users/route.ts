import { NextRequest, NextResponse } from "next/server";
import { listHQTeamMembers, updateHQTeamMemberAccess } from "@/lib/hq-team/store";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";

function publicUser(member: Awaited<ReturnType<typeof listHQTeamMembers>>[number]) {
  return {
    email: member.email,
    name: member.name,
    setvaId: member.setvaId,
    status: member.status,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

export async function GET(req: NextRequest) {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  const members = await listHQTeamMembers();
  return NextResponse.json({ users: members.map(publicUser) });
}

export async function PATCH(req: NextRequest) {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  let body: { email?: string; status?: "active" | "revoked" };
  try {
    body = (await req.json()) as { email?: string; status?: "active" | "revoked" };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const status = body.status;
  if (!email || (status !== "active" && status !== "revoked")) {
    return NextResponse.json({ error: "Email and valid status are required." }, { status: 400 });
  }

  if (email.toLowerCase() === user.email.toLowerCase() && status === "revoked") {
    return NextResponse.json({ error: "You cannot revoke your own access." }, { status: 400 });
  }

  try {
    const member = await updateHQTeamMemberAccess({ email, status });
    return NextResponse.json({ ok: true, user: publicUser(member) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
