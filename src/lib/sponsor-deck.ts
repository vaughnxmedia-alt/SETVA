import { createDeckAccessToken } from "@/lib/deck-access";
import { getPublicSiteUrl } from "@/lib/site-url";

export const sponsorDeck = {
  title: "SETVA 2026 Torch of Excellence",
} as const;

/** Public site origin for sponsor-deck emails and share links. */
export function siteUrl(): string {
  return getPublicSiteUrl();
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
