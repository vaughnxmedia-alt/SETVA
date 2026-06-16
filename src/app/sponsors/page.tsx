import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { SponsorDeckForm } from "@/components/SponsorDeckForm";
import { SponsorPackageCard } from "@/components/SponsorPackageCard";
import {
  site,
  sponsorMainPackages,
  sponsorPackages,
  sponsorSignaturePackages,
  sponsorSupporterPackages,
  vipAccessSummary,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Sponsor Packages",
  description:
    "SETVA 2026 sponsor packages — view every tier and get the free Torch of Excellence sponsorship deck emailed to you.",
};

export default function SponsorsPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Partner with us"
          title="Sponsor Packages"
          subtitle={`${site.event.theme} View every tier below, then get the free sponsorship deck sent to your email.`}
        />

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-ruby/20 bg-ruby/5 p-6 text-center sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ruby">
            {site.event.title}
          </p>
          <p className="mt-3 text-lg text-cream/90">
            {site.event.dateLabel} · {site.event.venue}, {site.event.location}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            A regional celebration of excellence across music, film, fashion,
            literature, media, education, entrepreneurship, and community impact
            — with {site.event.awardCategories} award categories and reach across{" "}
            {site.event.regions.join(", ")}.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-xl" id="get-deck">
          <SponsorDeckForm />
        </div>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Main packages"
            title="Torch of Excellence sponsorship tiers"
            subtitle="Full-event visibility from community supporter to presenting title partner."
            align="left"
          />
          <p className="mt-4 max-w-3xl text-sm text-cream/60">
            {vipAccessSummary}
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {sponsorMainPackages.map((pkg) => (
              <SponsorPackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Signature opportunities"
            title="Own a moment inside the event"
            subtitle="Targeted sponsorships tied to red carpet, awards, livestream, youth, and more."
            align="left"
          />
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {sponsorSignaturePackages.map((pkg) => (
              <SponsorPackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Supporters"
            title="Community & custom partnerships"
            align="left"
          />
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {sponsorSupporterPackages.map((pkg) => (
              <SponsorPackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </section>

        <section className="mt-16 overflow-x-auto">
          <SectionHeading
            eyebrow="Compare"
            title="Package overview"
            subtitle="See tiers side by side before you choose."
            align="left"
          />
          <table className="mt-8 w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gold/20 text-cream/60">
                <th className="py-3 pr-4 font-semibold">Package</th>
                <th className="py-3 pr-4 font-semibold">Investment</th>
                <th className="py-3 pr-4 font-semibold">VIP tickets</th>
                <th className="py-3 font-semibold">Key visibility</th>
              </tr>
            </thead>
            <tbody className="text-cream/80">
              {sponsorPackages
                .filter((pkg) => pkg.id !== "custom-partnership")
                .map((pkg) => (
                  <tr key={pkg.id} className="border-b border-gold/10">
                    <td className="py-3 pr-4 font-medium text-cream">
                      {pkg.name}
                    </td>
                    <td className="py-3 pr-4 text-gold">
                      {pkg.price > 0
                        ? `$${pkg.price.toLocaleString()}`
                        : "Custom"}
                    </td>
                    <td className="py-3 pr-4">
                      {pkg.benefits.find((b) => b.includes("VIP"))?.match(/\d+/)?.[0] ??
                        "—"}
                    </td>
                    <td className="py-3">{pkg.benefits[0]}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        <section className="mt-16 rounded-2xl border border-gold/20 bg-ink-deep/60 p-8 text-center sm:p-10">
          <h3 className="font-display text-2xl text-cream">Next steps</h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-cream/70">
            Sponsorship commitments are requested by{" "}
            <strong className="text-gold">{site.event.sponsorshipDeadline}</strong>{" "}
            to secure placement in print, digital, and on-site materials. Review
            the packages above, then email us to confirm your tier or request an
            invoice.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#get-deck"
              className="inline-flex rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink transition hover:bg-gold-light"
            >
              Get free sponsor package deck
            </a>
            <Link
              href={`mailto:${site.contact.email}?subject=${encodeURIComponent("SETVA 2026 Sponsorship")}`}
              className="inline-flex rounded-full bg-ruby px-8 py-3 text-sm font-semibold text-white transition hover:bg-ruby-light"
            >
              Email to sponsor
            </Link>
          </div>
          <p className="mt-6 text-sm text-cream/50">
            Questions? {site.contact.email} · {site.contact.phone}
          </p>
        </section>
      </div>
    </div>
  );
}
