import { isTicketSaleOpen, ticketPresale } from "@/lib/site";

/** Live SETVA 2026 event on Ticketmaster (Jefferson Theatre, Aug 8, 2026). */
const DEFAULT_TICKETMASTER_URL =
  "https://www.ticketmaster.com/the-southeast-texas-visionary-awards-show-beaumont-texas-08-08-2026/event/3A0064CFE020F8D7";

const TICKETMASTER_URL =
  process.env.NEXT_PUBLIC_TICKETMASTER_URL?.trim() || DEFAULT_TICKETMASTER_URL;

export function getTicketmasterUrl(): string {
  return TICKETMASTER_URL;
}

export function isTicketmasterConfigured(): boolean {
  return TICKETMASTER_URL.length > 0;
}

/** Where ticket CTAs should send users (Ticketmaster when configured, otherwise /tickets). */
export function ticketPurchaseHref(): string {
  if (isTicketmasterConfigured()) {
    return TICKETMASTER_URL;
  }
  return "/tickets";
}

export function isExternalTicketPurchase(): boolean {
  return isTicketmasterConfigured();
}

export function ticketOpensLabel(): string {
  return ticketPresale.startLabel;
}
