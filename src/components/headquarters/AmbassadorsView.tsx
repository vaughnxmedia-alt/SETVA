"use client";

import { useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import { HQBadge, HQEmptyState, HQSearchInput, hqInputClass, hqTableWrapClass } from "@/components/headquarters/ui";
import type { AmbassadorRecord } from "@/lib/headquarters/types";

const STATUSES = ["Pending Review", "Approved", "Active", "Paused", "Denied"];

export function AmbassadorsView({ ambassadors }: { ambassadors: AmbassadorRecord[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = ambassadors.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      item.organization.toLowerCase().includes(q);
    const matchStatus = status === "all" || item.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <HQShell title="Ambassadors">
      <p className="mb-6 text-sm text-cream/50">
        Ticket Partner (Ambassador) registrations, links, and status.
      </p>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <HQSearchInput value={search} onChange={setSearch} placeholder="Search ambassadors…" />
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
          title="No ambassadors yet"
          description="Ambassador registrations will appear here once the program opens."
        />
      ) : (
        <div className={hqTableWrapClass}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Channels</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gold/[0.03]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-cream">{item.name}</p>
                    <p className="text-xs text-cream/50">{item.email}</p>
                  </td>
                  <td className="px-4 py-3 text-cream/70">{item.city}</td>
                  <td className="px-4 py-3 text-cream/70">{item.channels}</td>
                  <td className="px-4 py-3 text-cream/70">
                    {item.ambassadorLink ? (
                      <a
                        href={item.ambassadorLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline"
                      >
                        View link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <HQBadge tone={item.status === "Active" ? "green" : "default"}>
                      {item.status}
                    </HQBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </HQShell>
  );
}
