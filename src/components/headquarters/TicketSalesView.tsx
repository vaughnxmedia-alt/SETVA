"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import {
  HQBadge,
  HQButton,
  HQCard,
  HQEmptyState,
  HQSearchInput,
  HQStatCard,
  hqInputClass,
  hqTableWrapClass,
} from "@/components/headquarters/ui";
import type { HQUser } from "@/lib/headquarters/auth";
import type { TicketSalesReconciliation, TicketSalesSourceRow } from "@/lib/headquarters/types";

type TicketSalesResponse = {
  success: boolean;
  reconciliation: TicketSalesReconciliation;
  imported?: number;
  skipped?: number;
  columns?: string[];
  removed?: number;
  error?: string;
};

const EMPTY: TicketSalesReconciliation = {
  rows: [],
  unmatchedBuyers: [],
  totals: { totalLeads: 0, importedBuyers: 0, matchedBuyers: 0, ticketsSold: 0, salesAmount: 0 },
};

function formatMoney(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatWhen(value: string): string {
  return new Date(value).toLocaleString();
}

type TicketSalesViewProps = {
  currentUser?: HQUser | null;
};

export function TicketSalesView({ currentUser }: TicketSalesViewProps) {
  const [data, setData] = useState<TicketSalesReconciliation>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [commissionRate, setCommissionRate] = useState(10);

  const [csv, setCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/headquarters/ticket-sales");
    if (!res.ok) throw new Error("Could not load ticket sales.");
    const json = (await res.json()) as TicketSalesResponse;
    setData(json.reconciliation ?? EMPTY);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setError("Could not load ticket sales."))
      .finally(() => setLoading(false));
  }, [refresh]);

  function toggle(sourceId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      return next;
    });
  }

  async function handleImport() {
    if (!csv.trim() || importing) return;
    setImporting(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch("/api/headquarters/ticket-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const json = (await res.json()) as TicketSalesResponse;
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not import the export.");
        return;
      }
      setData(json.reconciliation ?? EMPTY);
      setCsv("");
      const cols = json.columns?.length ? ` Columns detected: ${json.columns.join(", ")}.` : "";
      const skipped = json.skipped ? ` Skipped ${json.skipped} blank row(s).` : "";
      setNotice(`Imported ${json.imported ?? 0} buyer(s).${skipped}${cols}`);
    } catch {
      setError("Could not import the export.");
    } finally {
      setImporting(false);
    }
  }

  async function handleClear() {
    if (!window.confirm("Remove all imported Ticketmaster buyers? Captured form leads are kept.")) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/headquarters/ticket-sales", { method: "DELETE" });
      const json = (await res.json()) as TicketSalesResponse;
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not clear imported data.");
        return;
      }
      setData(json.reconciliation ?? EMPTY);
      setNotice(`Removed ${json.removed ?? 0} imported buyer(s).`);
    } catch {
      setError("Could not clear imported data.");
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter((row) =>
      [row.name, row.category, row.email].join(" ").toLowerCase().includes(q),
    );
  }, [data.rows, search]);

  const rate = Number.isFinite(commissionRate) ? Math.max(0, commissionRate) / 100 : 0;
  const commissionOwed = data.totals.salesAmount * rate;

  return (
    <HQShell title="Ticket Sales" user={currentUser}>
      <p className="mb-6 text-sm text-cream/50">
        Every ticket-form submission is captured per nominee below. Import the buyer list Ticketmaster
        sends you to match buyers by email and name, attribute sales, and track commission owed.
      </p>

      {notice ? (
        <p className="mb-4 rounded-lg border border-emerald/30 bg-emerald/10 px-4 py-2 text-sm text-emerald-light">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <HQStatCard label="Ticket forms filled" value={data.totals.totalLeads} hint="Across all nominees" />
        <HQStatCard label="Buyers imported" value={data.totals.importedBuyers} hint="From Ticketmaster export" />
        <HQStatCard
          label="Matched buyers"
          value={data.totals.matchedBuyers}
          hint={`${data.totals.ticketsSold} ticket(s) attributed`}
        />
        <HQStatCard label="Attributed sales" value={formatMoney(data.totals.salesAmount)} hint="Matched order totals" />
        <HQStatCard
          label="Commission owed"
          value={formatMoney(commissionOwed)}
          hint={`${commissionRate}% of attributed sales`}
        />
        <HQCard className="p-4">
          <label className="block text-[11px] font-medium uppercase tracking-wider text-cream/40">
            Commission rate (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={commissionRate}
            onChange={(e) => setCommissionRate(Number(e.target.value))}
            className={`${hqInputClass} mt-2`}
          />
        </HQCard>
      </div>

      <HQCard className="mb-8 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg text-gold">Import Ticketmaster sales</h2>
            <p className="mt-1 text-sm text-cream/50">
              Paste the export (CSV or tab-separated) including a header row. Recognized columns: name
              (or first/last name), email, phone, quantity, amount, order.
            </p>
          </div>
          {data.totals.importedBuyers > 0 ? (
            <HQButton variant="outline" onClick={() => void handleClear()} className="shrink-0">
              Clear imported data
            </HQButton>
          ) : null}
        </div>

        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={6}
          placeholder={"name,email,phone,quantity,amount,order\nJane Doe,jane@example.com,4095551234,2,150.00,TM-10021"}
          className={`${hqInputClass} mt-4 font-mono text-xs`}
        />
        <div className="mt-3 flex items-center gap-3">
          <HQButton onClick={() => void handleImport()} disabled={importing || !csv.trim()}>
            {importing ? "Importing…" : "Import & match"}
          </HQButton>
          <span className="text-xs text-cream/40">Imports add to existing data. Matching is by email, then name.</span>
        </div>
      </HQCard>

      <div className="mb-4 max-w-md">
        <HQSearchInput value={search} onChange={setSearch} placeholder="Search nominees or partners…" />
      </div>

      {loading ? (
        <p className="text-sm text-cream/50">Loading ticket sales…</p>
      ) : filteredRows.length === 0 ? (
        <HQEmptyState
          title="No ticket-form activity yet"
          description="When guests fill out a nominee's ticket form, they appear here. Import Ticketmaster sales to match buyers."
        />
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => (
            <SourceRow
              key={row.sourceId}
              row={row}
              expanded={expanded.has(row.sourceId)}
              onToggle={() => toggle(row.sourceId)}
              commissionRate={rate}
            />
          ))}
        </div>
      )}

      {data.unmatchedBuyers.length > 0 ? (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg text-gold">Unmatched buyers</h2>
              <p className="mt-1 text-sm text-cream/50">
                Imported buyers whose email and name did not match any captured ticket form.
              </p>
            </div>
            <HQBadge tone="amber">{data.unmatchedBuyers.length}</HQBadge>
          </div>
          <div className={hqTableWrapClass}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
                <tr>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {data.unmatchedBuyers.map((buyer) => (
                  <tr key={buyer.purchaseId} className="hover:bg-gold/[0.03]">
                    <td className="px-4 py-3 text-cream">{buyer.buyerName || "—"}</td>
                    <td className="px-4 py-3 text-cream/70">{buyer.buyerEmail || "—"}</td>
                    <td className="px-4 py-3 text-cream/70">{buyer.buyerPhone || "—"}</td>
                    <td className="px-4 py-3 text-cream/70">{buyer.quantity}</td>
                    <td className="px-4 py-3 text-cream/70">{buyer.amount ? formatMoney(buyer.amount) : "—"}</td>
                    <td className="px-4 py-3 text-cream/50">{buyer.orderRef || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </HQShell>
  );
}

function SourceRow({
  row,
  expanded,
  onToggle,
  commissionRate,
}: {
  row: TicketSalesSourceRow;
  expanded: boolean;
  onToggle: () => void;
  commissionRate: number;
}) {
  const commission = row.salesAmount * commissionRate;
  return (
    <HQCard className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-gold/[0.03]"
      >
        <span className="text-gold/60">{expanded ? "▾" : "▸"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-display text-lg text-cream">{row.name}</p>
            <HQBadge tone={row.sourceType === "nominee" ? "gold" : "default"}>{row.sourceType}</HQBadge>
          </div>
          <p className="mt-0.5 truncate text-sm text-cream/50">{row.category}</p>
        </div>
        <div className="hidden shrink-0 gap-6 text-right sm:flex">
          <Stat label="Forms" value={row.leads.length} />
          <Stat label="Buyers" value={row.matchedBuyers.length} />
          <Stat label="Tickets" value={row.ticketsSold} />
          <Stat label="Sales" value={formatMoney(row.salesAmount)} />
          <Stat label="Commission" value={formatMoney(commission)} accent />
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-gold/10 bg-black/20 px-5 py-4">
          <div className="mb-2 flex flex-wrap gap-4 text-xs text-cream/50 sm:hidden">
            <span>{row.leads.length} forms</span>
            <span>{row.matchedBuyers.length} buyers</span>
            <span>{row.ticketsSold} tickets</span>
            <span>{formatMoney(row.salesAmount)} sales</span>
            <span className="text-gold">{formatMoney(commission)} commission</span>
          </div>

          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/40">
            Ticket forms filled ({row.leads.length})
          </h3>
          {row.leads.length === 0 ? (
            <p className="mb-4 text-sm text-cream/40">No ticket forms submitted yet.</p>
          ) : (
            <div className={`${hqTableWrapClass} mb-6`}>
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
                  <tr>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Phone</th>
                    <th className="px-4 py-2.5">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {row.leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gold/[0.03]">
                      <td className="px-4 py-2.5 text-cream">{lead.buyerName || "—"}</td>
                      <td className="px-4 py-2.5 text-cream/70">{lead.buyerEmail || "—"}</td>
                      <td className="px-4 py-2.5 text-cream/70">{lead.buyerPhone || "—"}</td>
                      <td className="px-4 py-2.5 text-cream/50">{formatWhen(lead.submittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/40">
            Matched buyers ({row.matchedBuyers.length})
          </h3>
          {row.matchedBuyers.length === 0 ? (
            <p className="text-sm text-cream/40">
              No imported buyers matched yet. Import the Ticketmaster export to attribute sales.
            </p>
          ) : (
            <div className={hqTableWrapClass}>
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
                  <tr>
                    <th className="px-4 py-2.5">Buyer</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Phone</th>
                    <th className="px-4 py-2.5">Qty</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Matched by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {row.matchedBuyers.map((buyer) => (
                    <tr key={buyer.purchaseId} className="hover:bg-gold/[0.03]">
                      <td className="px-4 py-2.5 text-cream">{buyer.buyerName || "—"}</td>
                      <td className="px-4 py-2.5 text-cream/70">{buyer.buyerEmail || "—"}</td>
                      <td className="px-4 py-2.5 text-cream/70">{buyer.buyerPhone || "—"}</td>
                      <td className="px-4 py-2.5 text-cream/70">{buyer.quantity}</td>
                      <td className="px-4 py-2.5 text-cream/70">{buyer.amount ? formatMoney(buyer.amount) : "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs text-cream/50">{buyer.matchType}</span>
                        {buyer.ambiguous ? (
                          <span className="ml-2 inline-flex">
                            <HQBadge tone="amber">shared</HQBadge>
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </HQCard>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-cream/40">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${accent ? "text-gold" : "text-cream"}`}>{value}</p>
    </div>
  );
}
