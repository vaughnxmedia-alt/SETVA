import { createDeckAccessToken } from "@/lib/deck-access";

export const sponsorDeck = {
  title: "SETVA 2026 Torch of Excellence",
} as const;

const CANONICAL_SITE = "https://setvawards.com";

/** Public site origin for sponsor-deck emails and share links. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured && !/vercel\.app/i.test(configured)) {
    return configured;
  }
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return CANONICAL_SITE;
  }
  return configured || "http://localhost:3000";
}

export function slugifyDeckRecipient(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "partner"
  );
}

export function sponsorDeckViewUrl(
  baseUrl: string,
  access: { email: string; name: string },
): string {
  const base = baseUrl.replace(/\/$/, "");
  const token = createDeckAccessToken(access);
  const slug = slugifyDeckRecipient(access.name);
  return `${base}/sponsorshipdeck/${slug}?access=${encodeURIComponent(token)}`;
}

export function sponsorDeckLogoUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/setva-logo-white-transparent.png`;
}
