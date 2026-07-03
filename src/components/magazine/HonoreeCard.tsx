import Link from "next/link";
import type { PublicHonoree } from "@/lib/honorees";

export function HonoreeCard({ honoree }: { honoree: PublicHonoree }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-gold/25 bg-black/50 shadow-2xl backdrop-blur-sm">
      {honoree.graphicUrl ? (
        <Link href={`/magazine/honorees/${honoree.slug}`} className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={honoree.graphicUrl}
            alt={`${honoree.name} — ${honoree.awardTitle}`}
            className="aspect-square w-full object-cover transition hover:opacity-90"
          />
        </Link>
      ) : null}
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          {honoree.awardTitle}
        </p>
        <h2 className="mt-2 font-display text-xl text-white sm:text-2xl">
          <Link
            href={`/magazine/honorees/${honoree.slug}`}
            className="transition hover:text-gold"
          >
            {honoree.name}
          </Link>
        </h2>
        <Link
          href={`/magazine/honorees/${honoree.slug}`}
          className="mt-4 inline-flex rounded-full border border-white/20 bg-black/60 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-gold/50 hover:text-gold"
        >
          Read story
        </Link>
      </div>
    </article>
  );
}
