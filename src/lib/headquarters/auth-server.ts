import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { HQUser } from "@/lib/headquarters/auth";

export type { HQUser };

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = "setva-hq-session";
const ACCOUNT_COOKIE_NAME = "setva-hq-account";
const DEV_SESSION_SECRET = "setva-dev-hq-session-do-not-use-in-production";

type HQSessionPayload = HQUser & {
  exp: number;
};

type HQAccountPayload = HQUser & {
  password: string;
  exp: number;
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

function verifyEmailPassword(
  inputEmail: string,
  inputPassword: string,
  accountEmail: string,
  accountPassword: string,
): boolean {
  const normalizedInputEmail = normalizeEmail(inputEmail);
  const normalizedAccountEmail = normalizeEmail(accountEmail);

  const emailBuf = Buffer.from(normalizedInputEmail);
  const expectedEmailBuf = Buffer.from(normalizedAccountEmail);
  const passwordBuf = Buffer.from(inputPassword);
  const expectedPasswordBuf = Buffer.from(accountPassword);

  return (
    emailBuf.length === expectedEmailBuf.length &&
    passwordBuf.length === expectedPasswordBuf.length &&
    timingSafeEqual(emailBuf, expectedEmailBuf) &&
    timingSafeEqual(passwordBuf, expectedPasswordBuf)
  );
}

export function verifyHQCredentialsWithAccount(
  email: string,
  password: string,
  account: (HQUser & { password: string }) | null,
): HQUser | null {
  const fallback = verifyHQCredentials(email, password);
  if (fallback) return fallback;
  if (!account) return null;

  if (!verifyEmailPassword(email, password, account.email, account.password)) {
    return null;
  }

  return {
    email: account.email,
    name: account.name,
    phone: account.phone,
  };
}

export function createHQSessionToken(user: HQUser): string {
  const payload: HQSessionPayload = {
    ...user,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyHQSessionToken(token: string): HQUser | null {
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

    return {
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
    };
  } catch {
    return null;
  }
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

export function hqAccountCookieName(): string {
  return ACCOUNT_COOKIE_NAME;
}

export function createHQAccountToken(account: HQUser & { password: string }): string {
  const payload: HQAccountPayload = {
    ...account,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyHQAccountToken(token: string): (HQUser & { password: string }) | null {
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
    ) as HQAccountPayload;

    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (!payload.email || !payload.name || !payload.phone || !payload.password) return null;

    return {
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      password: payload.password,
    };
  } catch {
    return null;
  }
}

export async function getHQSessionUser(): Promise<HQUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? "";
  return verifyHQSessionToken(token);
}

export function getHQSessionUserFromRequest(req: NextRequest): HQUser | null {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? "";
  return verifyHQSessionToken(token);
}

export function getHQAccountFromRequest(req: NextRequest): (HQUser & { password: string }) | null {
  const token = req.cookies.get(ACCOUNT_COOKIE_NAME)?.value ?? "";
  return verifyHQAccountToken(token);
}
