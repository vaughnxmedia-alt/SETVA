import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifyPassword } from "@/lib/hq-team/password";
import { getHQTeamMemberByEmail } from "@/lib/hq-team/store";
import type { HQUser } from "@/lib/headquarters/auth";

export type { HQUser };

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = "setva-hq-session";
const DEV_SESSION_SECRET = "setva-dev-hq-session-do-not-use-in-production";

type HQSessionPayload = HQUser & {
  exp: number;
  sv: number;
};

function sessionSecret(): string {
  const secret = process.env.HEADQUARTERS_SESSION_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "development") return DEV_SESSION_SECRET;
  return process.env.HEADQUARTERS_DEV_PASSWORD?.trim() || DEV_SESSION_SECRET;
}

function devAccount(): HQUser & { password: string } {
  return {
    email: process.env.HEADQUARTERS_DEV_EMAIL?.trim() || "Justicevaughn7@gmail.com",
    password: process.env.HEADQUARTERS_DEV_PASSWORD?.trim() || "Texas4855",
    name: process.env.HEADQUARTERS_DEV_NAME?.trim() || "Justice Vaughn",
    phone: process.env.HEADQUARTERS_DEV_PHONE?.trim() || "4093442349",
  };
}

function sign(data: string): string {
  return createHmac("sha256", sessionSecret()).update(data).digest("base64url");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function verifyHQCredentials(email: string, password: string): HQUser | null {
  const account = devAccount();
  const inputEmail = normalizeEmail(email);
  const expectedEmail = normalizeEmail(account.email);

  const emailBuf = Buffer.from(inputEmail);
  const expectedEmailBuf = Buffer.from(expectedEmail);
  const passwordBuf = Buffer.from(password);
  const expectedPasswordBuf = Buffer.from(account.password);

  if (
    emailBuf.length !== expectedEmailBuf.length ||
    passwordBuf.length !== expectedPasswordBuf.length ||
    !timingSafeEqual(emailBuf, expectedEmailBuf) ||
    !timingSafeEqual(passwordBuf, expectedPasswordBuf)
  ) {
    return null;
  }

  return {
    email: account.email,
    name: account.name,
    phone: account.phone,
  };
}

function decodeHQSessionToken(token: string): HQSessionPayload | null {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  try {
    const expected = sign(encoded);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as HQSessionPayload;

    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (!payload.email || !payload.name || !payload.phone) return null;
    if (typeof payload.sv !== "number") return null;

    return payload;
  } catch {
    return null;
  }
}

export async function resolveHQSessionUser(token: string): Promise<HQUser | null> {
  const payload = decodeHQSessionToken(token);
  if (!payload) return null;

  const member = await getHQTeamMemberByEmail(payload.email);
  if (member) {
    if (member.status !== "active") return null;
    if (payload.sv !== member.sessionVersion) return null;

    return {
      email: member.email,
      name: member.name,
      phone: member.phone,
      setvaId: member.setvaId,
    };
  }

  const dev = devAccount();
  if (normalizeEmail(payload.email) !== normalizeEmail(dev.email)) return null;
  if (payload.sv !== 1) return null;

  return {
    email: dev.email,
    name: dev.name,
    phone: dev.phone,
  };
}

export async function verifyHQTeamCredentials(
  email: string,
  password: string,
  setvaId: string,
): Promise<{ user: HQUser; sessionVersion: number } | null> {
  const normalizedSetvaId = setvaId.trim().toUpperCase();
  if (!normalizedSetvaId) return null;

  const member = await getHQTeamMemberByEmail(email);
  if (member?.status === "active" && member.passwordHash) {
    if (member.setvaId.toUpperCase() !== normalizedSetvaId) return null;

    const valid = await verifyPassword(password, member.passwordHash);
    if (!valid) return null;

    return {
      user: {
        email: member.email,
        name: member.name,
        phone: member.phone,
        setvaId: member.setvaId,
      },
      sessionVersion: member.sessionVersion,
    };
  }

  const devUser = verifyHQCredentials(email, password);
  if (!devUser || member) return null;

  return { user: devUser, sessionVersion: 1 };
}

export function createHQSessionToken(user: HQUser, sessionVersion = 1): string {
  const payload: HQSessionPayload = {
    ...user,
    exp: Date.now() + SESSION_TTL_MS,
    sv: sessionVersion,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function hqSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function hqCookieName(): string {
  return COOKIE_NAME;
}

export async function getHQSessionUser(): Promise<HQUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? "";
  return resolveHQSessionUser(token);
}

export async function getHQSessionUserFromRequest(req: NextRequest): Promise<HQUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  return resolveHQSessionUser(token);
}
