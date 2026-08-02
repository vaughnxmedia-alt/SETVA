import { getSiteUrl } from "@/lib/metadata";
import { getTicketmasterUrl } from "@/lib/ticket-sales";

export function slugifyTicketPartner(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = id.replace(/[^a-z0-9]/gi, "").slice(-6).toLowerCase() || "setva";
  return base ? `${base}-${suffix}` : `partner-${suffix}`;
}

export function ticketPartnerTrackingPath(slug: string): string {
  return `/go/tickets/${encodeURIComponent(slug)}`;
}

export function ticketPartnerTrackingUrl(slug: string): string {
  return `${getSiteUrl()}${ticketPartnerTrackingPath(slug)}`;
}

export function ticketPartnerPurchaseThanksPath(slug: string): string {
  return `/tickets/purchased?ref=${encodeURIComponent(slug)}`;
}

export function ticketPartnerPurchaseThanksUrl(slug: string): string {
  return `${getSiteUrl()}${ticketPartnerPurchaseThanksPath(slug)}`;
}

/**
 * Ticketmaster destination for partner links.
 *
 * Tracking params are deliberately omitted: Ticketmaster never returns them to
 * us (sales are attributed by matching the exported buyer list against captured
 * leads), and unrecognized query strings make its bot check more likely to
 * challenge the buyer instead of showing the event.
 */
export function ticketmasterDestination(): string {
  const base = getTicketmasterUrl().trim();
  try {
    const url = new URL(base);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return base.split("?")[0].split("#")[0];
  }
}
