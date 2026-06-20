import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/hq-team/password";
import { activateHQTeamAccount } from "@/lib/hq-team/store";
import {
  createHQSessionToken,
  hqCookieName,
  hqSessionCookieOptions,
  verifyHQTeamCredentials,
} from "@/lib/headquarters/auth-server";

type ActivateBody = {
  setvaId?: string;
  email?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  let body: ActivateBody;
  try {
    body = (await req.json()) as ActivateBody;
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

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    const member = await activateHQTeamAccount({ setvaId, email, passwordHash });
    const auth = await verifyHQTeamCredentials(member.email, password, member.setvaId);
    if (!auth) {
      return NextResponse.json({ error: "Account activated but sign-in failed." }, { status: 500 });
    }

    const token = createHQSessionToken(auth.user, auth.sessionVersion);
    const response = NextResponse.json({ ok: true, user: auth.user });
    response.cookies.set(hqCookieName(), token, hqSessionCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to activate account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
