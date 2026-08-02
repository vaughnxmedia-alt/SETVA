import { NextRequest, NextResponse } from "next/server";
import { recordTicketLinkEvent } from "@/lib/ticket-link-events-store";
import { ticketmasterDestination } from "@/lib/ticket-partner/links";
import { saveTicketPartnerLead } from "@/lib/ticket-partner/leads-store";
import { parseTicketPartnerLeadInput } from "@/lib/ticket-partner/parse-lead";
import { resolveTicketPartnerBySlug } from "@/lib/ticket-partner/resolve";

const REF_COOKIE = "setva_ticket_ref";
const LEAD_COOKIE = "setva_ticket_lead";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = String(body.slug ?? "").trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing partner link." }, { status: 400 });
  }

  const parsed = parseTicketPartnerLeadInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { buyerName, buyerEmail, buyerPhone } = parsed.data;

  // A buyer must always end up at Ticketmaster. Attribution is best-effort:
  // an unknown slug or an unreachable database costs us the lead, not the sale.
  const redirectUrl = ticketmasterDestination();

  const partner = await resolveTicketPartnerBySlug(slug).catch(() => null);
  if (!partner) {
    return NextResponse.json({ ok: true, redirectUrl, attributed: false });
  }

  const lead = await saveTicketPartnerLead({
    buyerName,
    buyerEmail,
    buyerPhone,
    slug: partner.slug,
    sourceType: partner.sourceType,
    sourceId: partner.sourceId,
    sourceName: partner.sourceName,
    partnerCategory: partner.category,
  }).catch(() => null);

  const response = NextResponse.json({
    ok: true,
    redirectUrl,
    attributed: Boolean(lead),
    leadId: lead?.id,
  });

  response.cookies.set(REF_COOKIE, partner.slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  if (!lead) return response;

  await recordTicketLinkEvent({
    slug: partner.slug,
    sourceType: partner.sourceType,
    sourceId: partner.sourceId,
    sourceName: partner.sourceName,
    eventType: "lead",
    buyerName: lead.buyerName,
    leadId: lead.id,
    referrer: req.headers.get("referer") ?? "",
    userAgent: req.headers.get("user-agent") ?? "",
  }).catch(() => undefined);

  response.cookies.set(LEAD_COOKIE, lead.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
