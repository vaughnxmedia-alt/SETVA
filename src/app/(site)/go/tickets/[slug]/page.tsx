import { redirect } from "next/navigation";
import { TicketPartnerGateForm } from "@/components/tickets/TicketPartnerGateForm";
import { recordTicketLinkEvent } from "@/lib/ticket-link-events-store";
import { createPageMetadata } from "@/lib/metadata";
import { resolveTicketPartnerBySlug } from "@/lib/ticket-partner/resolve";

type TicketPartnerGatePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TicketPartnerGatePageProps) {
  const { slug } = await params;
  const partner = await resolveTicketPartnerBySlug(slug);
  return createPageMetadata({
    title: partner ? `Tickets via ${partner.sourceName}` : "Ticket partner link",
    description: "Enter your name to continue to Ticketmaster through a SETVA ticket partner link.",
    path: `/go/tickets/${slug}`,
  });
}

export default async function TicketPartnerGatePage({ params }: TicketPartnerGatePageProps) {
  const { slug } = await params;
  const partner = await resolveTicketPartnerBySlug(slug);

  if (!partner) {
    redirect("/tickets");
  }

  await recordTicketLinkEvent({
    slug: partner.slug,
    sourceType: partner.sourceType,
    sourceId: partner.sourceId,
    sourceName: partner.sourceName,
    eventType: "click",
  });

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <TicketPartnerGateForm partner={partner} />
    </div>
  );
}
