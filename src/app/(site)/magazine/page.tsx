import type { Metadata } from "next";
import { MagazineArticleCard } from "@/components/magazine/MagazineArticleCard";
import { MagazineHeroIntro } from "@/components/magazine/MagazineHeroIntro";
import { SetvaGradientPageShell } from "@/components/SetvaGradientPageShell";
import { listMagazineArticles, visionaryMagazine } from "@/lib/magazine";

export const metadata: Metadata = {
  title: visionaryMagazine.name,
  description: visionaryMagazine.tagline,
};

// Always render fresh so published nominee articles appear on the live site immediately.
export const dynamic = "force-dynamic";

export default async function MagazinePage() {
  const articles = await listMagazineArticles();

  return (
    <SetvaGradientPageShell>
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-5">
        <MagazineHeroIntro />

        <div className="mx-auto mt-8 max-w-3xl space-y-6 sm:mt-10">
          {articles.length === 0 ? (
            <div className="rounded-3xl border border-gold/25 bg-black/50 p-6 text-center text-white/70 shadow-2xl backdrop-blur-sm">
              Magazine features will appear here when SETVA publishes them.
            </div>
          ) : (
            articles.map((article) => (
              <MagazineArticleCard key={article.slug} article={article} />
            ))
          )}
        </div>
      </div>
    </SetvaGradientPageShell>
  );
}
