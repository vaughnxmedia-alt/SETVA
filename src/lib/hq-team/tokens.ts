import { createHmac, timingSafeEqual } from "crypto";

export type HQTeamTokenAction = "approve" | "activate";

export type HQTeamTokenPayload = {
  action: HQTeamTokenAction;
  email: string;
  exp: number;
};

function teamTokenSecret(): string {
  return (
    process.env.HEADQUARTERS_SESSION_SECRET?.trim() ||
    process.env.HEADQUARTERS_DEV_PASSWORD?.trim() ||
    "setva-dev-hq-session-do-not-use-in-production"
  );
}

function sign(encoded: string): string {
  return createHmac("sha256", teamTokenSecret()).update(encoded).digest("base64url");
}

export function createHQTeamToken(
  action: HQTeamTokenAction,
  email: string,
  ttlMs = 1000 * 60 * 60 * 48,
): string {
  const payload: HQTeamTokenPayload = {
    action,
    email: email.trim().toLowerCase(),
    exp: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyHQTeamToken(token: string, action: HQTeamTokenAction): HQTeamTokenPayload | null {
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
    ) as HQTeamTokenPayload;

    if (payload.action !== action) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (!payload.email) return null;

    return payload;
  } catch {
    return null;
  }
}
