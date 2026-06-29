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

/** Ticketmaster destination with partner attribution params. */
export function ticketmasterPartnerDestination(slug: string, leadId?: string): string {
  const base = getTicketmasterUrl();
  try {
    const url = new URL(base);
    url.searchParams.set("utm_source", "setva");
    url.searchParams.set("utm_medium", "ticket_partner");
    url.searchParams.set("utm_campaign", slug);
    url.searchParams.set("setva_ref", slug);
    if (leadId?.trim()) {
      url.searchParams.set("setva_lead", leadId.trim());
    }
    return url.toString();
  } catch {
    const joiner = base.includes("?") ? "&" : "?";
    const leadParam = leadId?.trim() ? `&setva_lead=${encodeURIComponent(leadId.trim())}` : "";
    return `${base}${joiner}utm_source=setva&utm_medium=ticket_partner&utm_campaign=${encodeURIComponent(slug)}&setva_ref=${encodeURIComponent(slug)}${leadParam}`;
  }
}
