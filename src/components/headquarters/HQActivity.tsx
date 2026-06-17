"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ActivityItem } from "@/lib/headquarters/types";
import { HQBadge, formatHQDate, hqInputClass, hqListItemClass, hqPanelClass } from "@/components/headquarters/ui";

export function HQActivityFeed({
  items,
  compact = false,
  limit,
}: {
  items: ActivityItem[];
  compact?: boolean;
  limit?: number;
}) {
  const shown = limit ? items.slice(0, limit) : items;

  if (shown.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-cream/40">No recent activity.</p>
    );
  }

  return (
    <ul className="divide-y divide-gold/10">
      {shown.map((item) => (
        <li
          key={item.id}
          className={`transition hover:bg-gold/[0.03] ${compact ? "px-3 py-3" : "px-5 py-4"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <HQBadge tone="gold">{item.category}</HQBadge>
                <span className="text-[11px] text-cream/35">{item.type}</span>
              </div>
              <p className={`mt-1.5 font-medium text-cream/85 ${compact ? "text-xs" : "text-sm"}`}>
                {item.personOrOrg}
              </p>
              <p className={`mt-0.5 text-cream/50 ${compact ? "text-[11px] line-clamp-2" : "text-sm"}`}>
                {item.summary}
              </p>
              <p className="mt-1.5 text-[10px] text-cream/30">{formatHQDate(item.timestamp)}</p>
            </div>
            {!compact ? (
              <Link
                href="/headquarters/analytics"
                className="shrink-0 text-xs text-gold/80 hover:text-gold"
              >
                Details
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function HQActivityRail({ items }: { items: ActivityItem[] }) {
  return (
    <aside className="hidden w-72 shrink-0 border-l border-gold/20 bg-ink-deep/50 xl:block">
      <div className="sticky top-0 max-h-screen overflow-y-auto">
        <div className="border-b border-gold/10 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-cream/40">
            Recent Activity
          </p>
        </div>
        <HQActivityFeed items={items} compact limit={8} />
        <div className="border-t border-gold/10 p-3">
          <Link href="/headquarters/analytics" className="text-xs text-gold hover:text-gold/80">
            View full timeline →
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function HQActivityTimeline({
  items,
  onViewDetails,
}: {
  items: ActivityItem[];
  onViewDetails?: (item: ActivityItem) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-cream/40">No activity matches your filters.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className={hqListItemClass}>
          <div className="flex flex-wrap items-center gap-2">
            <HQBadge tone="gold">{item.category}</HQBadge>
            <span className="text-xs text-cream/40">{item.type}</span>
            <span className="ml-auto text-xs text-cream/35">{formatHQDate(item.timestamp)}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-cream">{item.personOrOrg}</p>
          <p className="mt-1 text-sm text-cream/55">{item.summary}</p>
          {onViewDetails ? (
            <button
              type="button"
              onClick={() => onViewDetails(item)}
              className="mt-3 text-xs font-medium text-gold hover:text-gold/80"
            >
              View Details
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function useActivityFilters(items: ActivityItem[]) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      item.personOrOrg.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q);
    const matchesCategory = category === "all" || item.category === category;
    const ts = new Date(item.timestamp).getTime();
    const from = dateFrom ? new Date(dateFrom).getTime() : 0;
    const to = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Infinity;
    const matchesDate = ts >= from && ts <= to;
    return matchesSearch && matchesCategory && matchesDate;
  });

  return { search, setSearch, category, setCategory, dateFrom, setDateFrom, dateTo, setDateTo, filtered };
}

export function HQFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  categories,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  categories: string[];
}) {
  return (
    <div className={`flex flex-col gap-3 p-4 lg:flex-row lg:items-end ${hqPanelClass}`}>
      <div className="flex-1">
        <label className="mb-1 block text-[10px] uppercase tracking-wider text-cream/40">Search</label>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search activity…"
          className={`w-full ${hqInputClass}`}
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-wider text-cream/40">Category</label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={`w-full lg:w-40 ${hqInputClass}`}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-wider text-cream/40">From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className={hqInputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase tracking-wider text-cream/40">To</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className={hqInputClass}
        />
      </div>
    </div>
  );
}

export function HQCommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 px-4 pt-[15vh] backdrop-blur-sm">
      <div className="card-glow w-full max-w-lg rounded-xl border border-gold/20 bg-ink-deep shadow-2xl">
        <div className="border-b border-gold/10 px-4 py-3">
          <input
            autoFocus
            placeholder="Search Headquarters…"
            className="w-full bg-transparent text-sm text-cream outline-none placeholder:text-cream/30"
          />
        </div>
        <div className="px-4 py-6 text-center text-sm text-cream/40">
          Command palette coming soon. Use sidebar navigation for now.
        </div>
        <div className="border-t border-gold/10 px-4 py-2 text-[10px] text-cream/30">
          Press Esc to close · ⌘K
        </div>
      </div>
      <button type="button" className="fixed inset-0 -z-10" onClick={onClose} aria-label="Close" />
    </div>
  );
}
