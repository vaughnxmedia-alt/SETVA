import { NextRequest, NextResponse } from "next/server";
import { getHQTeamMemberByEmail } from "@/lib/hq-team/store";
import {
  createHQSessionToken,
  getHQSessionUserFromRequest,
  hqCookieName,
  hqSessionCookieOptions,
  verifyHQTeamCredentials,
} from "@/lib/headquarters/auth-server";

export async function GET(req: NextRequest) {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user });
}

export async function POST(req: NextRequest) {
  let body: { setvaId?: string; email?: string; password?: string };
  try {
    body = (await req.json()) as { setvaId?: string; email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const setvaId = body.setvaId?.trim().toUpperCase() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  if (!setvaId || !email || !password) {
    return NextResponse.json(
      { error: "SETVA ID, email, and password are required." },
      { status: 400 },
    );
  }

  const auth = await verifyHQTeamCredentials(email, password, setvaId);
  if (!auth) {
    const member = await getHQTeamMemberByEmail(email);
    if (member?.status === "pending_request") {
      return NextResponse.json(
        {
          error:
            "Your access request is pending SETVA review. Request access if you have not already.",
        },
        { status: 403 },
      );
    }
    if (member?.status === "approved") {
      return NextResponse.json(
        {
          error:
            "Check your email for your SETVA ID, then use the Create your account link to set your password.",
        },
        { status: 403 },
      );
    }
    if (member && member.setvaId.toUpperCase() !== setvaId) {
      return NextResponse.json({ error: "SETVA ID does not match this email." }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid SETVA ID, email, or password." }, { status: 401 });
  }

  const token = createHQSessionToken(auth.user, auth.sessionVersion);
  const response = NextResponse.json({ ok: true, user: auth.user });
  response.cookies.set(hqCookieName(), token, hqSessionCookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(hqCookieName(), "", { ...hqSessionCookieOptions(), maxAge: 0 });
  return response;
}
