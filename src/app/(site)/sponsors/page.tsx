import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { SponsorDeckForm } from "@/components/SponsorDeckForm";
import { SponsorPackageCard } from "@/components/SponsorPackageCard";
import {
  isPackageSoldOut,
  packageAvailabilityLabel,
} from "@/lib/sponsor-inventory";
import {
  site,
  sponsorMainPackages,
  sponsorMediaPackages,
  sponsorNonMediaSignaturePackages,
  sortSponsorPackagesByPrice,
  sponsorPackages,
  sponsorSupporterPackages,
  vipAccessSummary,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Sponsor Packages",
  description:
    "SETVA 2026 sponsor packages — view every tier and get a link to the sponsorship packages page emailed to you.",
};

export default function SponsorsPage() {
  return (
    <div className="relative isolate min-h-full overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/setva-red-carpet-jefferson-theatre.jpg"
          alt=""
          fill
          className="object-cover object-[center_28%]"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.9)_0%,rgba(11,0,0,0.84)_45%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute inset-0 bg-ruby/10" />
      </div>

      <div className="relative px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Partner with us"
          title="Sponsor Packages"
          subtitle={`${site.event.theme} View every tier below, or enter your email to get a link to the sponsor packages page.`}
        />

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-ruby/20 bg-ruby/5 p-6 text-center sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ruby">
            {site.event.title}
          </p>
          <p className="mt-3 text-lg text-cream/90">
            {site.event.dateLabel} · {site.event.venue}, {site.event.location}
          </p>
          <p className="mt-2 text-sm text-cream/60">
            All payments must be paid in full by {site.event.sponsorshipPaymentDue}.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            A regional celebration of excellence across music, film, fashion,
            literature, media, education, entrepreneurship, and community impact
            — with {site.event.awardCategories} award categories and reach across{" "}
            {site.event.regions.join(", ")}.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-gold/25 shadow-2xl">
          <div className="relative aspect-[3/2]">
            <Image
              src="/setva-red-carpet-jefferson-theatre.jpg"
              alt="SETVA red carpet at the Jefferson Theatre in Beaumont, Texas"
              fill
              className="object-cover object-[center_28%]"
              sizes="(max-width: 768px) 100vw, 1024px"
            />
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-xl" id="get-sponsor-link">
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
            eyebrow="Media & broadcast"
            title="Mont City Network sponsorships"
            subtitle="Live stream, media partner, and broadcast-aligned packages — grouped for easy comparison."
            align="left"
          />
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {sponsorMediaPackages.map((pkg) => (
              <SponsorPackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Signature opportunities"
            title="Own a moment inside the event"
            subtitle="Targeted sponsorships tied to red carpet, awards, youth, magazine, and more."
            align="left"
          />
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {sponsorNonMediaSignaturePackages.map((pkg) => (
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
                <th className="py-3 pr-4 font-semibold">Availability</th>
                <th className="py-3 pr-4 font-semibold">VIP tickets</th>
                <th className="py-3 font-semibold">Key visibility</th>
              </tr>
            </thead>
            <tbody className="text-cream/80">
              {sortSponsorPackagesByPrice(
                sponsorPackages.filter((pkg) => pkg.id !== "custom-partnership"),
              ).map((pkg) => (
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
                      {isPackageSoldOut(pkg) ? (
                        <span className="text-cream/50">Sold out</span>
                      ) : (
                        (packageAvailabilityLabel(pkg) ?? "Open")
                      )}
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
            to secure placement in print, digital, and on-site materials. Choose
            your tier above and click <strong className="text-gold">Buy</strong> for
            secure Square checkout, or pay by check or money order. Cash is not
            accepted for sponsorships. Email us for custom partnerships.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#get-sponsor-link"
              className="inline-flex rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink transition hover:bg-gold-light"
            >
              Get sponsor packages link
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
    </div>
  );
}
