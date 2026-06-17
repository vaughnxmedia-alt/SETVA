import Link from "next/link";
import type { SponsorPackage } from "@/lib/site";
import { site } from "@/lib/site";
import {
  isPackageSoldOut,
  packageAvailabilityLabel,
} from "@/lib/sponsor-inventory";
import { MontCityNetworkBadge } from "@/components/MontCityNetworkBadge";
import { SponsorPackageVisual } from "@/components/SponsorPackageVisual";

type SponsorPackageCardProps = {
  pkg: SponsorPackage;
  priorityVisual?: boolean;
};

export function SponsorPackageCard({
  pkg,
  priorityVisual = false,
}: SponsorPackageCardProps) {
  const soldOut = isPackageSoldOut(pkg);
  const availability = packageAvailabilityLabel(pkg);
  const canBuyOnline = pkg.price > 0 && !pkg.contactOnly && !soldOut;

  return (
    <article
      className={`card-glow flex flex-col rounded-2xl bg-ink-deep/60 p-8 ${
        pkg.highlighted ? "card-glow-highlight" : ""
      } ${soldOut ? "opacity-80" : ""}`}
    >
      <SponsorPackageVisual pkg={pkg} priority={priorityVisual} />

      <div className="mt-4 flex flex-wrap gap-2">
        {soldOut && (
          <span className="inline-block rounded-full bg-cream/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cream/70">
            Sold out
          </span>
        )}
        {!soldOut && availability && (
          <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
            {availability}
          </span>
        )}
        {pkg.highlighted && !soldOut && (
          <span className="inline-block rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
            Recommended
          </span>
        )}
        {pkg.featured && !pkg.highlighted && !soldOut && (
          <span className="inline-block rounded-full bg-ruby/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ruby-light">
            High demand
          </span>
        )}
      </div>

      <h3 className="mt-4 font-display text-2xl text-cream">{pkg.name}</h3>
      {pkg.price > 0 ? (
        <p className="mt-2 text-3xl font-semibold text-gold">
          ${pkg.price.toLocaleString()}
        </p>
      ) : (
        <p className="mt-2 text-xl text-gold">Contact for pricing</p>
      )}

      <p className="mt-4 text-sm text-cream/70">{pkg.description}</p>

      {pkg.pitch && (
        <p className="mt-4 border-l-2 border-gold/40 pl-4 text-sm italic text-cream/60">
          &ldquo;{pkg.pitch}&rdquo;
        </p>
      )}

      <ul className="mt-6 flex-1 space-y-2 text-sm text-cream/80">
        {pkg.benefits.map((benefit) => {
          const isMontCityBenefit = benefit.includes("Mont City Network");
          return (
            <li key={benefit} className="flex gap-2">
              <span className="text-gold">✓</span>
              <span className={isMontCityBenefit ? "text-cream/90" : undefined}>
                {benefit}
              </span>
            </li>
          );
        })}
      </ul>

      {pkg.montCityMedia && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/35 px-4 py-3">
          <p className="text-xs text-cream/55">Broadcast & production partner</p>
          <MontCityNetworkBadge compact />
        </div>
      )}

      {pkg.bestFit && (
        <p className="mt-6 text-xs text-cream/50">
          <span className="font-semibold uppercase tracking-wider text-gold/80">
            Best fit:{" "}
          </span>
          {pkg.bestFit}
        </p>
      )}

      <div className="mt-8">
        {canBuyOnline ? (
          <Link
            href={`/sponsors/checkout?package=${pkg.id}`}
            className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
              pkg.highlighted
                ? "bg-gold text-ink hover:bg-gold-light"
                : "bg-ruby text-white hover:bg-ruby-light"
            }`}
          >
            Buy — ${pkg.price.toLocaleString()}
          </Link>
        ) : soldOut ? (
          <Link
            href={`/contact?subject=${encodeURIComponent(`SETVA 2026 — ${pkg.name} waitlist`)}`}
            className="inline-flex w-full items-center justify-center rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold text-cream/80 transition hover:bg-cream/5"
          >
            Join waitlist
          </Link>
        ) : (
          <Link
            href={`/contact?subject=${encodeURIComponent(`SETVA 2026 — ${pkg.name}`)}`}
            className="inline-flex w-full items-center justify-center rounded-full border border-gold/50 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold/10"
          >
            Request a custom package
          </Link>
        )}
      </div>

      {canBuyOnline && (
        <p className="mt-3 text-center text-xs text-cream/45">
          Secure checkout via Square · Questions?{" "}
          <a
            href={`mailto:${site.contact.email}`}
            className="text-gold hover:underline"
          >
            {site.contact.email}
          </a>
        </p>
      )}
    </article>
  );
}
