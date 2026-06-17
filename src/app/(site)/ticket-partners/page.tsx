import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { isAmbassadorRegistrationOpen } from "@/lib/ambassadors";
import { site, ticketPartnerInfo } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ticket Partners",
  description: "Earn commission selling SETVA 2026 tickets — Ticket Partner program.",
};

export default function TicketPartnersPage() {
  const registrationOpen = isAmbassadorRegistrationOpen();

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Earn while you share"
          title="Ticket Partner Program"
          subtitle={`Earn ${ticketPartnerInfo.commissionPercent}% on every ticket sold through your custom link.`}
        />
        {!registrationOpen && (
          <p className="mt-8 rounded-2xl border border-gold/20 bg-gold/10 px-5 py-4 text-sm text-cream/80">
            Ambassador registration opens {ticketPartnerInfo.registrationOpensLabel}.
          </p>
        )}
        <div className="mt-10 space-y-4 text-cream/80">
          <p>
            Want to support the vision and earn cash while doing it? Whether you
            share with family, church, your business, or social media — every sale
            through your link is credited to you.
          </p>
          <ol className="list-decimal space-y-3 pl-5">
            {ticketPartnerInfo.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="card-glow mt-10 rounded-2xl bg-ink-deep/60 p-8">
          <h3 className="font-display text-lg text-gold">Sample earnings</h3>
          <p className="mt-2 text-sm text-cream/50">
            At {ticketPartnerInfo.commissionPercent}% commission (illustrative)
          </p>
          <ul className="mt-6 space-y-4">
            {ticketPartnerInfo.sampleEarnings.map((row) => (
              <li
                key={row.tier}
                className="flex items-center justify-between border-b border-gold/10 pb-3 text-sm last:border-0"
              >
                <span className="text-cream/70">
                  {row.tickets} × {row.tier}
                </span>
                <span className="font-semibold text-gold">
                  ~${row.earnings}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/ambassadors"
            className="rounded-full bg-gold px-8 py-4 text-center font-semibold text-ink hover:bg-gold-light"
          >
            {registrationOpen ? "Register as an Ambassador" : "Ambassador registration"}
          </Link>
          <a
            href={site.contact.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-gold/50 px-8 py-4 text-center font-semibold text-gold hover:bg-gold/10"
          >
            WhatsApp us
          </a>
        </div>
      </div>
    </div>
  );
}
