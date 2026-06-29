import { NextRequest, NextResponse } from "next/server";
import { recordTicketLinkEvent } from "@/lib/ticket-link-events-store";
import { ticketmasterPartnerDestination } from "@/lib/ticket-partner/links";
import { saveTicketPartnerLead } from "@/lib/ticket-partner/leads-store";
import { resolveTicketPartnerBySlug } from "@/lib/ticket-partner/resolve";

const REF_COOKIE = "setva_ticket_ref";
const LEAD_COOKIE = "setva_ticket_lead";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

export async function POST(req: NextRequest) {
  let body: { slug?: string; buyerName?: string };
  try {
    body = (await req.json()) as { slug?: string; buyerName?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = body.slug?.trim() ?? "";
  const buyerName = body.buyerName?.trim() ?? "";
  if (!slug) {
    return NextResponse.json({ error: "Missing partner link." }, { status: 400 });
  }
  if (!buyerName) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  const partner = await resolveTicketPartnerBySlug(slug);
  if (!partner) {
    return NextResponse.json({ error: "This ticket partner link is not active." }, { status: 404 });
  }

  const lead = await saveTicketPartnerLead({
    buyerName,
    slug: partner.slug,
    sourceType: partner.sourceType,
    sourceId: partner.sourceId,
    sourceName: partner.sourceName,
    partnerCategory: partner.category,
  });

  if (!lead) {
    // Continue to Ticketmaster even when storage is unavailable locally.
    const redirectUrl = ticketmasterPartnerDestination(partner.slug);
    const response = NextResponse.json({ ok: true, redirectUrl });
    response.cookies.set(REF_COOKIE, partner.slug, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  }

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
  });

  const redirectUrl = ticketmasterPartnerDestination(partner.slug, lead.id);
  const response = NextResponse.json({ ok: true, redirectUrl, leadId: lead.id });
  response.cookies.set(REF_COOKIE, partner.slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(LEAD_COOKIE, lead.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}
