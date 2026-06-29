import { NextRequest, NextResponse } from "next/server";
import { recordTicketLinkEvent } from "@/lib/ticket-link-events-store";
import { ticketmasterPartnerDestination } from "@/lib/ticket-partner/links";
import { resolveTicketPartnerBySlug } from "@/lib/ticket-partner/resolve";

const REF_COOKIE = "setva_ticket_ref";
const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const partner = await resolveTicketPartnerBySlug(slug);

  if (!partner) {
    return NextResponse.redirect(new URL("/tickets", req.url), { status: 302 });
  }

  await recordTicketLinkEvent({
    slug: partner.slug,
    sourceType: partner.sourceType,
    sourceId: partner.sourceId,
    sourceName: partner.sourceName,
    eventType: "click",
    referrer: req.headers.get("referer") ?? "",
    userAgent: req.headers.get("user-agent") ?? "",
  });

  const response = NextResponse.redirect(ticketmasterPartnerDestination(partner.slug), {
    status: 302,
  });
  response.cookies.set(REF_COOKIE, partner.slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REF_COOKIE_MAX_AGE,
  });
  return response;
}
