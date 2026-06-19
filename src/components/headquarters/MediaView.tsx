"use client";

import { useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import { HQBadge, HQEmptyState, HQSearchInput, hqInputClass, hqListItemClass } from "@/components/headquarters/ui";
import type { MediaApplication } from "@/lib/headquarters/types";

const STATUSES = [
  "Pending Review",
  "Approved",
  "Approved with Restrictions",
  "Waitlisted",
  "Denied",
];

export function MediaView({ applications }: { applications: MediaApplication[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = applications.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || m.outlet.toLowerCase().includes(q) || m.contact.toLowerCase().includes(q);
    const matchStatus = status === "all" || m.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <HQShell title="Media Credentials">
      <p className="mb-6 text-sm text-cream/50">
        Review media applications. Standard credentials are Red Carpet Only.
      </p>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <HQSearchInput value={search} onChange={setSearch} placeholder="Search media…" />
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
          title="No media applications yet"
          description="Media credential submissions will appear here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((m) => (
            <div key={m.id} className={hqListItemClass}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-cream">{m.outlet}</p>
                <HQBadge tone={m.status === "Approved" ? "green" : "amber"}>{m.status}</HQBadge>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-cream/35">Contact</dt>
                  <dd className="text-cream/75">{m.contact}</dd>
                </div>
                <div>
                  <dt className="text-cream/35">Audience</dt>
                  <dd className="text-cream/75">{m.audience}</dd>
                </div>
                <div>
                  <dt className="text-cream/35">Coverage</dt>
                  <dd className="text-cream/75">{m.coverage}</dd>
                </div>
                <div>
                  <dt className="text-cream/35">Credential</dt>
                  <dd className="text-cream/75">{m.credentialType}</dd>
                </div>
                <div>
                  <dt className="text-cream/35">Team size</dt>
                  <dd className="text-cream/75">{m.teamSize}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      )}
    </HQShell>
  );
}
