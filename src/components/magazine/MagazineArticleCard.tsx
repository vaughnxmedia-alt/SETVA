import Link from "next/link";
import type { MagazineArticle } from "@/lib/magazine";

export function MagazineArticleCard({ article }: { article: MagazineArticle }) {
  return (
    <article className="rounded-3xl border border-gold/25 bg-black/50 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
        {article.publishedLabel}
      </p>
      <h2 className="mt-3 font-display text-2xl text-white sm:text-3xl">
        <Link
          href={`/magazine/${article.slug}`}
          className="transition hover:text-gold"
        >
          {article.title}
        </Link>
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base">
        {article.excerpt}
      </p>
      <Link
        href={`/magazine/${article.slug}`}
        className="mt-6 inline-flex rounded-full border border-white/20 bg-black/60 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-gold/50 hover:text-gold"
      >
        Read article
      </Link>
    </article>
  );
}
