import type { Metadata } from "next";
import { NominationCategoryShowcase } from "@/components/nominations/NominationCategoryShowcase";
import { NominationsHeroIntro } from "@/components/nominations/NominationsHeroIntro";
import { NominationsPageShell } from "@/components/nominations/NominationsPageShell";
import { nominationCategories } from "@/lib/nominations";

export const metadata: Metadata = {
  title: "Nominations",
  description: "Explore SETVA 2026 nominations by category — artists, albums, bands, and more.",
};

export default function NominationsPage() {
  return (
    <NominationsPageShell>
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-5">
        <NominationsHeroIntro />

        <div className="mt-8 flex flex-col gap-6 sm:mt-10 sm:gap-8">
          {nominationCategories.map((category, index) => (
            <NominationCategoryShowcase
              key={category.id}
              category={category}
              index={index}
            />
          ))}
        </div>
      </div>
    </NominationsPageShell>
  );
}
