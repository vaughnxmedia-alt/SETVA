"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import {
  HQBadge,
  HQCard,
  HQCardHeader,
  HQEmptyState,
  HQSearchInput,
  HQStatCard,
  hqInputClass,
} from "@/components/headquarters/ui";
import type { HQVotingCategorySection } from "@/lib/votes-store";

type VotingResponse = {
  votingOpen: boolean;
  opensLabel: string;
  grandTotal: number;
  nomineesWithVotes: number;
  categorySections: HQVotingCategorySection[];
};

export function VotingView() {
  const [data, setData] = useState<VotingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/headquarters/votes");
    if (!res.ok) throw new Error("Could not load voting results.");
    const json = (await res.json()) as VotingResponse;
    setData(json);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setError("Could not load voting results."))
      .finally(() => setLoading(false));
  }, [refresh]);

  const filteredSections = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.categorySections
      .filter((section) => categoryFilter === "all" || section.categoryId === categoryFilter)
      .map((section) => ({
        ...section,
        nominees: section.nominees.filter((nominee) =>
          [nominee.nomineeName, section.categoryTitle].join(" ").toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.nominees.length > 0);
  }, [categoryFilter, data, search]);

  return (
    <HQShell title="Voting">
      <p className="mb-5 text-sm text-cream/50">
        Internal vote totals from public nominations. Guests vote by clicking a nominee card, then
        continue to that nominee&apos;s ticket link.
      </p>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-cream/50">Loading voting results…</p>
      ) : data ? (
        <>
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              data.votingOpen
                ? "border-emerald/30 bg-emerald/10 text-emerald-light"
                : "border-gold/25 bg-gold/10 text-gold"
            }`}
          >
            {data.votingOpen
              ? "Voting is live on the public nominations page."
              : `Voting opens ${data.opensLabel}. Nominee cards are visible but greyed out until then.`}
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <HQStatCard label="Total votes" value={data.grandTotal} hint="Recorded nominee clicks" />
            <HQStatCard
              label="Nominees receiving votes"
              value={data.nomineesWithVotes}
              hint="At least one vote recorded"
            />
          </div>

          <div className="mb-6 flex flex-col gap-3 lg:flex-row">
            <div className="flex-1">
              <HQSearchInput value={search} onChange={setSearch} placeholder="Search nominees…" />
            </div>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className={`${hqInputClass} lg:min-w-[220px]`}
            >
              <option value="all">All categories</option>
              {data.categorySections.map((section) => (
                <option key={section.categoryId} value={section.categoryId}>
                  {section.categoryTitle}
                </option>
              ))}
            </select>
          </div>

          {filteredSections.length === 0 ? (
            <HQEmptyState
              title="No voting results yet"
              description="Vote totals will appear here once guests start voting on the nominations page."
            />
          ) : (
            <div className="space-y-8">
              {filteredSections.map((section) => (
                <HQCard key={section.categoryId}>
                  <HQCardHeader
                    title={section.categoryTitle}
                    subtitle={`${section.totalVotes} vote${section.totalVotes === 1 ? "" : "s"} in this category`}
                  />
                  <div className="divide-y divide-gold/10">
                    {section.nominees.map((nominee, index) => (
                      <div
                        key={nominee.nomineeId}
                        className="flex items-center gap-4 px-5 py-4"
                      >
                        <span className="w-8 shrink-0 text-sm font-semibold text-gold/70">
                          #{index + 1}
                        </span>
                        {nominee.graphicUrl ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gold/20 bg-black/40">
                            <Image
                              src={nominee.graphicUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                        ) : (
                          <div className="h-14 w-14 shrink-0 rounded-lg border border-dashed border-gold/20 bg-black/20" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-cream">{nominee.nomineeName}</p>
                          <p className="mt-1 text-xs text-cream/45">
                            {nominee.voteCount} vote{nominee.voteCount === 1 ? "" : "s"}
                            {section.totalVotes > 0
                              ? ` · ${nominee.categoryPercent}% of category`
                              : ""}
                          </p>
                        </div>
                        <HQBadge tone={nominee.voteCount > 0 ? "green" : "default"}>
                          {nominee.voteCount}
                        </HQBadge>
                      </div>
                    ))}
                  </div>
                </HQCard>
              ))}
            </div>
          )}
        </>
      ) : null}
    </HQShell>
  );
}
