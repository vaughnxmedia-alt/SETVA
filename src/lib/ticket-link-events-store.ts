import { randomBytes } from "crypto";
import {
  createFormSubmission,
  FORM_TYPES,
  formStorageMode,
  listFormSubmissions,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";
import type {
  TicketLinkEvent,
  TicketLinkEventType,
  TicketPartnerAnalytics,
  TicketPartnerLinkStats,
  TicketPartnerSource,
} from "@/lib/ticket-partner/types";
import { ticketPartnerTrackingUrl } from "@/lib/ticket-partner/links";

type TicketLinkEventPayload = {
  slug: string;
  sourceType: TicketPartnerSource;
  sourceId: string;
  sourceName: string;
  eventType: TicketLinkEventType;
  referrer: string;
  userAgent: string;
  buyerName: string;
  leadId: string;
};

function createEventId(): string {
  return `tle_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function eventFromRecord(record: FormSubmissionRecord): TicketLinkEvent {
  const payload = record.payload as TicketLinkEventPayload;
  return {
    id: record.external_id ?? record.id,
    slug: payload.slug,
    sourceType: payload.sourceType,
    sourceId: payload.sourceId,
    sourceName: payload.sourceName,
    eventType: payload.eventType,
    occurredAt: record.submitted_at,
    referrer: payload.referrer,
    userAgent: payload.userAgent,
    buyerName: payload.buyerName ?? "",
    leadId: payload.leadId ?? "",
  };
}

export async function recordTicketLinkEvent(input: {
  slug: string;
  sourceType: TicketPartnerSource;
  sourceId: string;
  sourceName: string;
  eventType: TicketLinkEventType;
  referrer?: string;
  userAgent?: string;
  buyerName?: string;
  leadId?: string;
}): Promise<TicketLinkEvent | null> {
  if (formStorageMode() !== "supabase") return null;

  const id = createEventId();
  const payload: TicketLinkEventPayload = {
    slug: input.slug,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    sourceName: input.sourceName,
    eventType: input.eventType,
    referrer: input.referrer?.slice(0, 500) ?? "",
    userAgent: input.userAgent?.slice(0, 500) ?? "",
    buyerName: input.buyerName?.trim().slice(0, 120) ?? "",
    leadId: input.leadId?.trim() ?? "",
  };

  const record = await createFormSubmission({
    externalId: id,
    formType: FORM_TYPES.ticketLinkEvents,
    status: input.eventType,
    contactName: input.sourceName,
    payload,
  });

  return record ? eventFromRecord(record) : null;
}

export async function listTicketLinkEvents(): Promise<TicketLinkEvent[]> {
  if (formStorageMode() !== "supabase") return [];
  const records = await listFormSubmissions(FORM_TYPES.ticketLinkEvents);
  return records
    .map(eventFromRecord)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export function aggregateTicketPartnerStats(
  links: Omit<TicketPartnerLinkStats, "clickCount" | "purchaseCount" | "lastClickAt" | "lastPurchaseAt">[],
  events: TicketLinkEvent[],
): TicketPartnerLinkStats[] {
  const bySlug = new Map<string, TicketPartnerLinkStats>();

  for (const link of links) {
    bySlug.set(link.slug, {
      ...link,
      clickCount: 0,
      purchaseCount: 0,
      lastClickAt: null,
      lastPurchaseAt: null,
    });
  }

  for (const event of events) {
    const current = bySlug.get(event.slug);
    if (!current) continue;
    if (event.eventType === "click") {
      current.clickCount += 1;
      if (!current.lastClickAt || event.occurredAt > current.lastClickAt) {
        current.lastClickAt = event.occurredAt;
      }
    }
    if (event.eventType === "purchase") {
      current.purchaseCount += 1;
      if (!current.lastPurchaseAt || event.occurredAt > current.lastPurchaseAt) {
        current.lastPurchaseAt = event.occurredAt;
      }
    }
  }

  return [...bySlug.values()].sort((a, b) => b.clickCount - a.clickCount || a.name.localeCompare(b.name));
}

export function buildTicketPartnerAnalytics(
  links: Omit<TicketPartnerLinkStats, "clickCount" | "purchaseCount" | "lastClickAt" | "lastPurchaseAt">[],
  events: TicketLinkEvent[],
): TicketPartnerAnalytics {
  const aggregated = aggregateTicketPartnerStats(links, events);
  return {
    totalClicks: aggregated.reduce((sum, link) => sum + link.clickCount, 0),
    totalPurchases: aggregated.reduce((sum, link) => sum + link.purchaseCount, 0),
    links: aggregated,
    recentEvents: events.slice(0, 50),
  };
}

export function nomineeTicketPartnerLink(input: {
  id: string;
  name: string;
  category: string;
  email: string;
  slug: string;
}): Omit<TicketPartnerLinkStats, "clickCount" | "purchaseCount" | "lastClickAt" | "lastPurchaseAt"> {
  return {
    slug: input.slug,
    sourceType: "nominee",
    sourceId: input.id,
    name: input.name,
    category: input.category,
    email: input.email,
    trackingUrl: ticketPartnerTrackingUrl(input.slug),
  };
}

export function ambassadorTicketPartnerLink(input: {
  id: string;
  name: string;
  email: string;
  slug: string;
}): Omit<TicketPartnerLinkStats, "clickCount" | "purchaseCount" | "lastClickAt" | "lastPurchaseAt"> {
  return {
    slug: input.slug,
    sourceType: "ambassador",
    sourceId: input.id,
    name: input.name,
    category: "Ticket Partner",
    email: input.email,
    trackingUrl: ticketPartnerTrackingUrl(input.slug),
  };
}
