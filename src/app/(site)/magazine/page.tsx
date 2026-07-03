import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagazineContent } from "@/components/magazine/MagazineContent";
import { MagazineHeroIntro } from "@/components/magazine/MagazineHeroIntro";
import { SetvaGradientPageShell } from "@/components/SetvaGradientPageShell";
import {
  listMagazineArticles,
  listMagazineHonorees,
  MAGAZINE_PUBLIC_ENABLED,
  visionaryMagazine,
} from "@/lib/magazine";

export const metadata: Metadata = {
  title: visionaryMagazine.name,
  description: visionaryMagazine.tagline,
};

// Always render fresh so published nominee articles appear on the live site immediately.
export const dynamic = "force-dynamic";

export default async function MagazinePage() {
  if (!MAGAZINE_PUBLIC_ENABLED) notFound();

  const [articles, honorees] = await Promise.all([
    listMagazineArticles(),
    listMagazineHonorees(),
  ]);

  return (
    <SetvaGradientPageShell>
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-5">
        <MagazineHeroIntro />

        <MagazineContent articles={articles} honorees={honorees} />
      </div>
    </SetvaGradientPageShell>
  );
}
