import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const COOKIE_NAME = "setva-media-admin";
const DEV_FALLBACK_SECRET = "setva-dev-media-admin-do-not-use-in-production";

type AdminSessionPayload = {
  exp: number;
};

function adminSecret(): string {
  const secret = process.env.MEDIA_CREDENTIALS_ADMIN_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "development") {
    return DEV_FALLBACK_SECRET;
  }
  throw new Error("MEDIA_CREDENTIALS_ADMIN_SECRET is not configured");
}

function sign(data: string): string {
  return createHmac("sha256", adminSecret()).update(data).digest("base64url");
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.MEDIA_CREDENTIALS_ADMIN_SECRET?.trim();
  if (!expected) {
    return process.env.NODE_ENV === "development" && password === DEV_FALLBACK_SECRET;
  }

  const input = Buffer.from(password);
  const secret = Buffer.from(expected);
  if (input.length !== secret.length) return false;
  return timingSafeEqual(input, secret);
}

export function createAdminSessionToken(): string {
  const payload: AdminSessionPayload = {
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminSessionToken(token: string): boolean {
  if (!token) return false;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;

  try {
    const expected = sign(encoded);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as AdminSessionPayload;

    return typeof payload.exp === "number" && payload.exp >= Date.now();
  } catch {
    return false;
  }
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function adminCookieName(): string {
  return COOKIE_NAME;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? "";
  return verifyAdminSessionToken(token);
}

export async function requireAdminSession(
  req: NextRequest,
): Promise<{ ok: true } | { ok: false }> {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  if (!verifyAdminSessionToken(token)) {
    return { ok: false };
  }
  return { ok: true };
}
