import { NextRequest, NextResponse } from "next/server";
import { verifyHQAdminSignupPassword } from "@/lib/hq-team/admin-password";
import { sendHQWelcomeEmail } from "@/lib/hq-team/email";
import { hashPassword } from "@/lib/hq-team/password";
import { registerHQTeamMember } from "@/lib/hq-team/store";
import {
  createHQSessionToken,
  hqCookieName,
  hqSessionCookieOptions,
} from "@/lib/headquarters/auth-server";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  accessCode?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: RegisterBody;
  try {
    body = (await req.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const accessCode = body.accessCode ?? "";

  if (!name || !email || !EMAIL_PATTERN.test(email) || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  if (!verifyHQAdminSignupPassword(accessCode)) {
    return NextResponse.json({ error: "Invalid access code." }, { status: 403 });
  }

  try {
    const passwordHash = await hashPassword(password);
    const member = await registerHQTeamMember({ name, email, passwordHash });

    try {
      await sendHQWelcomeEmail({
        name: member.name,
        email: member.email,
        setvaId: member.setvaId,
      });
    } catch {
      // Account is created even if welcome email fails.
    }

    const user = {
      email: member.email,
      name: member.name,
      phone: member.phone,
      setvaId: member.setvaId,
    };
    const token = createHQSessionToken(user, member.sessionVersion);
    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(hqCookieName(), token, hqSessionCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
