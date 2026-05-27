import type { Metadata } from "next";
import { CheckoutButton } from "@/components/CheckoutButton";
import { SectionHeading } from "@/components/SectionHeading";
import { site, ticketTiers } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tickets",
  description: "Purchase tickets for SETVA 2026 — Southeast Texas Visionary Awards.",
};

export default function TicketsPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="SETVA 2026"
          title="Get your tickets"
          subtitle={`Join us in Beaumont, Texas — ${site.event.dateLabel}. ${site.event.time}.`}
        />
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-cream/70">
          Awards show at {site.event.venue}, {site.event.time}. Day-of tickets ($40)
          are sold {site.event.dayOfTicketWindow} at the {site.event.boxOffice}.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {ticketTiers.map((tier) => (
            <article
              key={tier.id}
              className={`card-glow flex flex-col rounded-2xl bg-ink-deep/60 p-8 ${
                tier.highlighted ? "card-glow-highlight lg:-mt-2 lg:mb-2" : ""
              }`}
            >
              {tier.highlighted && (
                <span className="mb-4 inline-block w-fit rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                  Best Value
                </span>
              )}
              <h3 className="font-display text-2xl text-cream">{tier.name}</h3>
              <p className="mt-2 text-3xl font-semibold text-gold">
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
                {tier.boxOfficeOnly ? (
                  <p className="rounded-full border border-gold/40 bg-gold/10 px-4 py-3 text-center text-sm font-semibold text-gold">
                    Box office only — 12–3 PM show day
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
