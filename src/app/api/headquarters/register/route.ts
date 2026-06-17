import { NextRequest, NextResponse } from "next/server";
import {
  createHQAccountToken,
  createHQSessionToken,
  hqAccountCookieName,
  hqCookieName,
  hqSessionCookieOptions,
} from "@/lib/headquarters/auth-server";

type RegisterBody = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  let body: RegisterBody;
  try {
    body = (await req.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const password = body.password ?? "";

  if (!name || !email || !phone || !password) {
    return NextResponse.json(
      { error: "Name, email, phone, and password are required." },
      { status: 400 },
    );
  }

  const user = { name, email, phone };
  const accountToken = createHQAccountToken({ ...user, password });
  const sessionToken = createHQSessionToken(user);

  const response = NextResponse.json({ ok: true, user });
  response.cookies.set(hqAccountCookieName(), accountToken, hqSessionCookieOptions());
  response.cookies.set(hqCookieName(), sessionToken, hqSessionCookieOptions());
  return response;
}
