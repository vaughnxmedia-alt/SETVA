import { NextRequest, NextResponse } from "next/server";
import { recordTicketLinkEvent } from "@/lib/ticket-link-events-store";
import { getTicketPartnerLead } from "@/lib/ticket-partner/leads-store";
import { resolveTicketPartnerBySlug } from "@/lib/ticket-partner/resolve";

export async function POST(req: NextRequest) {
  let body: { slug?: string };
  try {
    body = (await req.json()) as { slug?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = body.slug?.trim() ?? req.cookies.get("setva_ticket_ref")?.value?.trim() ?? "";
  const leadId = req.cookies.get("setva_ticket_lead")?.value?.trim() ?? "";
  if (!slug) {
    return NextResponse.json({ error: "Missing partner reference." }, { status: 400 });
  }

  const partner = await resolveTicketPartnerBySlug(slug);
  if (!partner) {
    return NextResponse.json({ error: "Unknown partner link." }, { status: 404 });
  }

  const lead = leadId ? await getTicketPartnerLead(leadId) : null;

  const event = await recordTicketLinkEvent({
    slug: partner.slug,
    sourceType: partner.sourceType,
    sourceId: partner.sourceId,
    sourceName: partner.sourceName,
    eventType: "purchase",
    buyerName: lead?.buyerName ?? "",
    leadId: lead?.id ?? leadId,
    referrer: req.headers.get("referer") ?? "",
    userAgent: req.headers.get("user-agent") ?? "",
  });

  if (!event) {
    return NextResponse.json({ error: "Tracking storage is not configured." }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true, event });
  response.cookies.set("setva_ticket_ref", "", { path: "/", maxAge: 0 });
  response.cookies.set("setva_ticket_lead", "", { path: "/", maxAge: 0 });
  return response;
}
