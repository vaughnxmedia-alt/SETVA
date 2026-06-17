import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEV_FALLBACK_SECRET = "setva-dev-deck-access-do-not-use-in-production";

export type DeckAccessPayload = {
  email: string;
  name: string;
  exp: number;
};

function accessSecret(): string {
  const secret = process.env.SPONSOR_DECK_ACCESS_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "development") {
    return DEV_FALLBACK_SECRET;
  }
  throw new Error("SPONSOR_DECK_ACCESS_SECRET is not configured");
}

function sign(data: string): string {
  return createHmac("sha256", accessSecret()).update(data).digest("base64url");
}

export function createDeckAccessToken(payload: {
  email: string;
  name: string;
}): string {
  const body: DeckAccessPayload = {
    email: payload.email.toLowerCase(),
    name: payload.name.trim(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyDeckAccessToken(token: string): DeckAccessPayload | null {
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
    ) as DeckAccessPayload;

    if (
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
