export const sponsorDeck = {
  title: "SETVA 2026 Torch of Excellence",
  fileName: "setva-2026-torch-of-excellence.pdf",
  publicPath: "/downloads/setva-2026-torch-of-excellence.pdf",
} as const;

export function sponsorDeckDownloadUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const override = process.env.SPONSOR_DECK_URL?.trim();
  if (override) {
    return override.startsWith("http") ? override : `${base}${override}`;
  }
  return `${base}${sponsorDeck.publicPath}`;
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
