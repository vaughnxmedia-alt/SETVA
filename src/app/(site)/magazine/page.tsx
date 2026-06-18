import type { Metadata } from "next";
import { MagazineArticleCard } from "@/components/magazine/MagazineArticleCard";
import { MagazineHeroIntro } from "@/components/magazine/MagazineHeroIntro";
import { SetvaGradientPageShell } from "@/components/SetvaGradientPageShell";
import { magazineArticles, visionaryMagazine } from "@/lib/magazine";

export const metadata: Metadata = {
  title: visionaryMagazine.name,
  description: visionaryMagazine.tagline,
};

export default function MagazinePage() {
  return (
    <SetvaGradientPageShell>
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-5">
        <MagazineHeroIntro />

        <div className="mx-auto mt-8 max-w-3xl space-y-6 sm:mt-10">
          {magazineArticles.map((article) => (
            <MagazineArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </SetvaGradientPageShell>
  );
}
