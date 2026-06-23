import { NextRequest, NextResponse } from "next/server";
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
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const auth = await verifyHQTeamCredentials(email, password);
  if (!auth) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
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
