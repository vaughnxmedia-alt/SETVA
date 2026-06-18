import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MagazineArticleBody } from "@/components/magazine/MagazineArticleBody";
import { SetvaGradientPageShell } from "@/components/SetvaGradientPageShell";
import {
  getMagazineArticle,
  magazineArticles,
  visionaryMagazine,
} from "@/lib/magazine";

type MagazineArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return magazineArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: MagazineArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getMagazineArticle(slug);

  if (!article) {
    return { title: "Article not found" };
  }

  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function MagazineArticlePage({ params }: MagazineArticlePageProps) {
  const { slug } = await params;
  const article = getMagazineArticle(slug);

  if (!article) {
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
              {visionaryMagazine.name}
            </p>
            <p className="mt-3 text-sm text-white/70">{article.publishedLabel}</p>
            <h1 className="mt-4 font-display text-3xl text-white sm:text-4xl sm:leading-tight">
              {article.title}
            </h1>

            <div className="mt-8 border-t border-white/10 pt-8">
              <MagazineArticleBody blocks={article.blocks} />
            </div>
          </article>
        </div>
      </div>
    </SetvaGradientPageShell>
  );
}
