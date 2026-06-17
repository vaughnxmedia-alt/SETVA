"use client";

import { useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import { HQBadge, HQEmptyState, HQSearchInput, hqInputClass, hqTableWrapClass } from "@/components/headquarters/ui";
import type { VolunteerRecord } from "@/lib/headquarters/types";

const STATUSES = ["Pending Review", "Approved", "Confirmed", "Checked In", "Completed", "No Show"];
const CATEGORIES = ["Pre-Event", "Event Day", "Post-Event"];

export function VolunteersView({ volunteers }: { volunteers: VolunteerRecord[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = volunteers.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.role.toLowerCase().includes(q);
    const matchCat = category === "all" || v.category === category;
    const matchStatus = status === "all" || v.status === status;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <HQShell title="Volunteers">
      <p className="mb-6 text-sm text-cream/50">Volunteer registrations, roles, and assignments.</p>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <HQSearchInput value={search} onChange={setSearch} placeholder="Search volunteers…" />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={hqInputClass}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
          title="No volunteers yet"
          description="Volunteer registrations will appear here."
        />
      ) : (
        <div className={hqTableWrapClass}>
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-gold/[0.03]">
                  <td className="px-4 py-3 font-medium text-cream">{v.name}</td>
                  <td className="px-4 py-3 text-cream/70">{v.category}</td>
                  <td className="px-4 py-3 text-cream/70">{v.role}</td>
                  <td className="px-4 py-3">
                    <HQBadge tone={v.status === "Confirmed" ? "green" : "default"}>{v.status}</HQBadge>
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
