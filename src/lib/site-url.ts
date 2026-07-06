export const CANONICAL_SITE_URL = "https://www.setvawards.com";
export const CANONICAL_SITE_HOST = "www.setvawards.com";

/** True when the hostname is a Vercel preview/default deployment URL. */
export function isVercelAppHost(host: string): boolean {
  return /\.vercel\.app$/i.test(host.trim());
}

/**
 * Public site origin for links, metadata, emails, and partner tracking URLs.
 * Never returns a vercel.app URL in production.
 */
export function getPublicSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured && !/vercel\.app/i.test(configured)) {
    return configured;
  }
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return CANONICAL_SITE_URL;
  }
  return configured || CANONICAL_SITE_URL;
}
