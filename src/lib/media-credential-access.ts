import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const DEV_FALLBACK_SECRET = "setva-dev-media-access-do-not-use-in-production";

export type MediaCredentialAccessPayload = {
  applicationId: string;
  email: string;
  exp: number;
};

function accessSecret(): string {
  const secret = process.env.MEDIA_CREDENTIAL_ACCESS_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") {
    return DEV_FALLBACK_SECRET;
  }
  throw new Error("MEDIA_CREDENTIAL_ACCESS_SECRET is not configured");
}

function sign(data: string): string {
  return createHmac("sha256", accessSecret()).update(data).digest("base64url");
}

export function createMediaCredentialAccessToken(payload: {
  applicationId: string;
  email: string;
}): string {
  const body: MediaCredentialAccessPayload = {
    applicationId: payload.applicationId.trim(),
    email: payload.email.trim().toLowerCase(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyMediaCredentialAccessToken(
  token: string,
): MediaCredentialAccessPayload | null {
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
    ) as MediaCredentialAccessPayload;

    if (
      typeof payload.applicationId !== "string" ||
      typeof payload.email !== "string" ||
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
