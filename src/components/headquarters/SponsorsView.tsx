"use client";

import { useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import { HQBadge, HQEmptyState, HQSearchInput, hqInputClass, hqTableWrapClass } from "@/components/headquarters/ui";
import type { SponsorLead } from "@/lib/headquarters/types";

const STATUSES = [
  "New Lead",
  "Contacted",
  "Proposal Sent",
  "Negotiation",
  "Paid",
  "Assets Received",
  "Activated",
];

export function SponsorsView({ sponsors }: { sponsors: SponsorLead[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = sponsors.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.company.toLowerCase().includes(q) ||
      s.contact.toLowerCase().includes(q);
    const matchStatus = status === "all" || s.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <HQShell title="Sponsors">
      <p className="mb-6 text-sm text-cream/50">Sponsor pipeline and partnership progress.</p>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <HQSearchInput value={search} onChange={setSearch} placeholder="Search sponsors…" />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={hqInputClass}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {filtered.length === 0 ? (
        <HQEmptyState
          title="No sponsors yet"
          description="Sponsor inquiries and confirmed packages will appear here."
        />
      ) : (
        <div className={hqTableWrapClass}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Next action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gold/[0.03]">
                  <td className="px-4 py-3 font-medium text-cream">{s.company}</td>
                  <td className="px-4 py-3 text-cream/70">{s.contact}</td>
                  <td className="px-4 py-3 text-cream/70">{s.packageName}</td>
                  <td className="px-4 py-3">
                    <HQBadge tone="gold">{s.status}</HQBadge>
                  </td>
                  <td className="px-4 py-3 text-cream/60">{s.paymentStatus}</td>
                  <td className="px-4 py-3 text-cream/50">{s.notes}</td>
                  <td className="px-4 py-3 text-cream/60">{s.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </HQShell>
  );
}
