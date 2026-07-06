"use client";

import { useMemo, useState } from "react";
import type { PublicNomineePageCategory } from "@/lib/nominees";
import { NominationCategoryShowcase } from "@/components/nominations/NominationCategoryShowcase";

type NominationsBrowseProps = {
  categories: PublicNomineePageCategory[];
  votingOpen: boolean;
};

export function NominationsBrowse({ categories, votingOpen }: NominationsBrowseProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");

  const visibleCategories = useMemo(() => {
    if (activeCategoryId === "all") return categories;
    return categories.filter((category) => category.id === activeCategoryId);
  }, [activeCategoryId, categories]);

  return (
    <>
      <nav
        aria-label="Nomination categories"
        className="mt-8 flex flex-wrap justify-center gap-2 sm:mt-10"
      >
        <CategoryTab
          active={activeCategoryId === "all"}
          onClick={() => setActiveCategoryId("all")}
        >
          All Categories
        </CategoryTab>
        {categories.map((category) => (
          <CategoryTab
            key={category.id}
            active={activeCategoryId === category.id}
            onClick={() => setActiveCategoryId(category.id)}
          >
            {category.title}
          </CategoryTab>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-6 sm:mt-10 sm:gap-10">
        {visibleCategories.map((category, index) => (
          <NominationCategoryShowcase
            key={category.id}
            category={category}
            index={categories.findIndex((item) => item.id === category.id) ?? index}
            votingOpen={votingOpen}
          />
        ))}
      </div>
    </>
  );
}

function CategoryTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-gold bg-gold/15 text-gold"
          : "border-white/15 bg-black/40 text-white/75 hover:border-gold/40 hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}
