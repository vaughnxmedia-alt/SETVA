import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MagazineArticleBody } from "@/components/magazine/MagazineArticleBody";
import { SetvaGradientPageShell } from "@/components/SetvaGradientPageShell";
import { getMagazineHonoree, MAGAZINE_PUBLIC_ENABLED, visionaryMagazine } from "@/lib/magazine";

type HonoreePageProps = {
  params: Promise<{ slug: string }>;
};

// Always render fresh so published honoree edits appear on the live site immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: HonoreePageProps): Promise<Metadata> {
  const { slug } = await params;
  const honoree = await getMagazineHonoree(slug);
  if (!honoree) return { title: "Honoree not found" };
  return {
    title: `${honoree.name} — ${honoree.awardTitle}`,
    description: `${honoree.name}, ${honoree.awardTitle} honoree at the ${visionaryMagazine.name}.`,
  };
}

export default async function HonoreePage({ params }: HonoreePageProps) {
  if (!MAGAZINE_PUBLIC_ENABLED) notFound();

  const { slug } = await params;
  const honoree = await getMagazineHonoree(slug);

  if (!honoree) {
    notFound();
  }

  return (
    <SetvaGradientPageShell>
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-5">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/magazine"
            className="inline-flex text-sm font-semibold text-gold transition hover:text-white"
          >
            ← Back to {visionaryMagazine.name}
          </Link>

          <article className="mt-6 rounded-3xl border border-gold/25 bg-black/50 p-6 shadow-2xl backdrop-blur-sm sm:mt-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
              {honoree.awardTitle}
            </p>
            <h1 className="mt-3 font-display text-3xl text-white sm:text-4xl sm:leading-tight">
              {honoree.name}
            </h1>

            {honoree.graphicUrl ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-gold/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={honoree.graphicUrl}
                  alt={`${honoree.name} — ${honoree.awardTitle}`}
                  className="w-full object-contain"
                />
              </div>
            ) : null}

            <div className="mt-8 border-t border-white/10 pt-8">
              {honoree.accomplishmentsHtml || honoree.pullQuote ? (
                <MagazineArticleBody
                  nomineeBioHtml=""
                  pullQuote={honoree.pullQuote}
                  articleBodyHtml={honoree.accomplishmentsHtml}
                />
              ) : (
                <p className="text-sm text-white/60">
                  A full write-up for this honoree is coming soon.
                </p>
              )}
            </div>
          </article>
        </div>
      </div>
    </SetvaGradientPageShell>
  );
}
