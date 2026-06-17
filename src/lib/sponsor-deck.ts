import { createDeckAccessToken } from "@/lib/deck-access";

export const sponsorDeck = {
  title: "SETVA 2026 Torch of Excellence",
  fileName: "setva-2026-torch-of-excellence.pdf",
  /** Gated viewer — not linked from main navigation */
  viewerPath: "/sponsors/deck",
} as const;

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function sponsorDeckViewUrl(
  baseUrl: string,
  access: { email: string; name: string },
): string {
  const base = baseUrl.replace(/\/$/, "");
  const token = createDeckAccessToken(access);
  return `${base}${sponsorDeck.viewerPath}?access=${encodeURIComponent(token)}`;
}

export function sponsorDeckDocumentUrl(baseUrl: string, token: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/api/sponsor-deck/document?access=${encodeURIComponent(token)}`;
}

export function sponsorDeckLogoUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/setva-logo-white-transparent.png`;
}
