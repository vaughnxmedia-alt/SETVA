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
  const [searchQuery, setSearchQuery] = useState("");

  const visibleCategories = useMemo(() => {
    const scopedCategories =
      activeCategoryId === "all"
        ? categories
        : categories.filter((category) => category.id === activeCategoryId);
    const query = normalizeSearch(searchQuery);

    if (!query) return scopedCategories;

    return scopedCategories
      .map((category) => {
        const categoryMatches = normalizeSearch(category.title).includes(query);
        const nominees = categoryMatches
          ? category.nominees
          : category.nominees.filter((nominee) =>
              normalizeSearch(nominee.nomineeName).includes(query),
            );

        return { ...category, nominees };
      })
      .filter((category) => category.nominees.length > 0);
  }, [activeCategoryId, categories, searchQuery]);

  return (
    <>
      <div className="mx-auto mt-8 w-full max-w-2xl sm:mt-10">
        <label htmlFor="nomination-search" className="sr-only">
          Search nominations
        </label>
        <div className="relative">
          <input
            id="nomination-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search nominees or categories..."
            className="w-full rounded-2xl border border-gold/25 bg-black/55 px-4 py-3 pr-12 text-sm font-medium text-white placeholder:text-white/40 outline-none transition focus:border-gold/60 focus:bg-black/70 focus:ring-2 focus:ring-gold/20 sm:text-base"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-semibold text-white/45 transition hover:text-gold"
              aria-label="Clear search"
            >
              Clear
            </button>
          ) : (
            <span
              aria-hidden
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35"
            >
              Search
            </span>
          )}
        </div>
        {searchQuery ? (
          <p className="mt-2 text-center text-xs text-white/50">
            Showing matches for "{searchQuery.trim()}"
          </p>
        ) : null}
      </div>

      <nav
        aria-label="Nomination categories"
        className="mt-5 flex min-w-0 flex-wrap justify-center gap-2 sm:mt-6"
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

      <div className="mt-8 flex min-w-0 flex-col gap-6 sm:mt-10 sm:gap-10">
        {visibleCategories.length > 0 ? (
          visibleCategories.map((category, index) => (
            <NominationCategoryShowcase
              key={category.id}
              category={category}
              index={categories.findIndex((item) => item.id === category.id) ?? index}
              votingOpen={votingOpen}
            />
          ))
        ) : (
          <div className="rounded-3xl border border-gold/20 bg-black/45 px-5 py-10 text-center">
            <p className="font-display text-2xl text-white">No matches found</p>
            <p className="mt-2 text-sm text-white/55">
              Try a nominee name, category name, or clear the search.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function normalizeSearch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
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
      className={`max-w-full rounded-full border px-3 py-2 text-left text-xs font-semibold transition sm:px-4 sm:text-sm ${
        active
          ? "border-gold bg-gold/15 text-gold"
          : "border-white/15 bg-black/40 text-white/75 hover:border-gold/40 hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}
