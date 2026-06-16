import type { SponsorPackage } from "@/lib/site";

type SponsorPackageCardProps = {
  pkg: SponsorPackage;
};

export function SponsorPackageCard({ pkg }: SponsorPackageCardProps) {
  return (
    <article
      className={`card-glow flex flex-col rounded-2xl bg-ink-deep/60 p-8 ${
        pkg.highlighted ? "card-glow-highlight" : ""
      }`}
    >
      {pkg.highlighted && (
        <span className="mb-4 inline-block w-fit rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
          Recommended
        </span>
      )}
      {pkg.featured && !pkg.highlighted && (
        <span className="mb-4 inline-block w-fit rounded-full bg-ruby/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ruby-light">
          High demand
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

      {pkg.pitch && (
        <p className="mt-4 border-l-2 border-gold/40 pl-4 text-sm italic text-cream/60">
          &ldquo;{pkg.pitch}&rdquo;
        </p>
      )}

      <ul className="mt-6 flex-1 space-y-2 text-sm text-cream/80">
        {pkg.benefits.map((benefit) => (
          <li key={benefit} className="flex gap-2">
            <span className="text-gold">✓</span>
            {benefit}
          </li>
        ))}
      </ul>

      {pkg.bestFit && (
        <p className="mt-6 text-xs text-cream/50">
          <span className="font-semibold uppercase tracking-wider text-gold/80">
            Best fit:{" "}
          </span>
          {pkg.bestFit}
        </p>
      )}

    </article>
  );
}
