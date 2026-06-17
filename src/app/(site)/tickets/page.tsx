import type { Metadata } from "next";
import { CheckoutButton } from "@/components/CheckoutButton";
import { SectionHeading } from "@/components/SectionHeading";
import {
  getTicketTiers,
  isTicketPresaleActive,
  isTicketSaleOpen,
  site,
  ticketPresale,
  ticketSaleClosedMessage,
} from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tickets",
  description: "Purchase tickets for SETVA 2026 — Southeast Texas Visionary Awards.",
};

export default function TicketsPage() {
  const tiers = getTicketTiers();
  const saleOpen = isTicketSaleOpen();
  const presale = isTicketPresaleActive();

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="SETVA 2026"
          title="Get your tickets"
          subtitle={`Join us in Beaumont, Texas — ${site.event.dateLabel}. ${site.event.time}.`}
        />

        {!saleOpen && (
          <p className="mx-auto mt-8 max-w-2xl rounded-2xl border border-gold/25 bg-gold/10 px-5 py-4 text-center text-sm text-cream/85">
            {ticketSaleClosedMessage()} Pre-sale runs through {ticketPresale.endLabel}.
          </p>
        )}

        {presale && (
          <p className="mx-auto mt-8 max-w-2xl rounded-2xl border border-ruby/25 bg-ruby/10 px-5 py-4 text-center text-sm text-cream/85">
            Pre-sale pricing through {ticketPresale.endLabel} — VIP $40, Preferred Seating $25.
            Prices increase to VIP $50 and Preferred Seating $30 after the pre-sale ends.
          </p>
        )}

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className={`card-glow flex flex-col rounded-2xl bg-ink-deep/60 p-8 ${
                tier.highlighted ? "card-glow-highlight lg:-mt-2 lg:mb-2" : ""
              }`}
            >
              {tier.highlighted && (
                <span className="mb-4 inline-block w-fit rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                  {presale ? "Pre-sale VIP" : "VIP"}
                </span>
              )}
              {presale && !tier.highlighted && (
                <span className="mb-4 inline-block w-fit rounded-full bg-ruby/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ruby-light">
                  Pre-sale
                </span>
              )}
              <h3 className="font-display text-2xl text-cream">{tier.name}</h3>
              <p className="mt-2 text-3xl font-semibold text-gold">
                {tier.compareAtPrice != null && (
                  <span className="mr-2 text-xl font-normal text-cream/40 line-through">
                    ${tier.compareAtPrice}
                  </span>
                )}
                ${tier.price}
                <span className="text-base font-normal text-cream/50">
                  {" "}
                  / {tier.unitLabel ?? "ticket"}
                </span>
              </p>
              {tier.available != null && (
                <p className="mt-1 text-xs text-amber-200/80">
                  ~{tier.available} available
                </p>
              )}
              <p className="mt-4 text-sm text-cream/70">{tier.description}</p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-cream/80">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <span className="text-gold">✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {!saleOpen ? (
                  <p className="rounded-full border border-gold/40 bg-gold/10 px-4 py-3 text-center text-sm font-semibold text-gold">
                    Opens {ticketPresale.startLabel}
                  </p>
                ) : (
                  <CheckoutButton
                    type="ticket"
                    itemId={tier.id}
                    label={`Buy ${tier.name}`}
                    className="w-full"
                  />
                )}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-cream/50">
          Secure checkout powered by Square. Questions?{" "}
          <a href={`mailto:${site.contact.email}`} className="text-gold hover:underline">
            {site.contact.email}
          </a>
        </p>
      </div>
    </div>
  );
}
