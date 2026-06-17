"use client";

import {
  HQActivityTimeline,
  HQFilterBar,
  useActivityFilters,
} from "@/components/headquarters/HQActivity";
import type { ActivityItem } from "@/lib/headquarters/types";

const CATEGORIES = [
  "Sponsors",
  "Media",
  "Volunteers",
  "Nominees",
  "Payments",
  "Broadcast",
  "Website",
  "Content",
  "General",
];

export function HQActivitySection({ items }: { items: ActivityItem[] }) {
  const {
    search,
    setSearch,
    category,
    setCategory,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filtered,
  } = useActivityFilters(items);

  return (
    <section className="mt-10 border-t border-gold/15 pt-10">
      <h2 className="font-display text-base text-gold">Activity</h2>
      <p className="mt-1 mb-6 text-sm text-cream/50">
        Universal activity timeline across all operations.
      </p>
      <HQFilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        categories={CATEGORIES}
      />
      <div className="mt-6">
        <HQActivityTimeline items={filtered} />
      </div>
    </section>
  );
}
