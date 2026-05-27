import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PlaceholderNote } from "@/components/PlaceholderNote";
import { SectionHeading } from "@/components/SectionHeading";
import { site, sponsorPackages } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sponsor Packages",
  description: "Partner with SETVA 2026 — sponsor packages for businesses and organizations.",
};

export default function SponsorsPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Partner with us"
          title="Sponsor SETVA 2026"
          subtitle="Join us in making this our most impactful celebration yet. Your partnership honors local talent and inspires the community."
        />
        <PlaceholderNote className="mx-auto mt-8 max-w-xl" />

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {sponsorPackages.map((pkg) => (
            <article
              key={pkg.id}
              className={`card-glow flex flex-col rounded-2xl bg-ink-deep/60 p-8 ${
                pkg.highlighted ? "card-glow-highlight" : ""
              }`}
            >
              {pkg.highlighted && (
                <span className="mb-4 inline-block w-fit rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                  Recommended
                </span>
              )}
              <h3 className="font-display text-2xl text-cream">{pkg.name}</h3>
              {pkg.price > 0 ? (
                <p className="mt-2 text-3xl font-semibold text-gold">
                  ${pkg.price.toLocaleString()}
                </p>
              ) : (
                <p className="mt-2 text-xl text-gold">Contact for pricing</p>
              )}
              <p className="mt-4 text-sm text-cream/70">{pkg.description}</p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-cream/80">
                {pkg.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-2">
                    <span className="text-gold">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {pkg.id === "custom" ? (
                  <Link
                    href="/contact?subject=sponsorship"
                    className="inline-flex w-full items-center justify-center rounded-full border border-gold/50 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold/10"
                  >
                    Request a custom package
                  </Link>
                ) : (
                  <CheckoutButton
                    type="sponsor"
                    itemId={pkg.id}
                    label={`Preview — ${pkg.name}`}
                    className="w-full"
                  />
                )}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-cream/50">
          Need an invoice or multi-year agreement? Email{" "}
          <a href={`mailto:${site.contact.email}`} className="text-gold hover:underline">
            {site.contact.email}
          </a>
        </p>
      </div>
    </div>
  );
}
