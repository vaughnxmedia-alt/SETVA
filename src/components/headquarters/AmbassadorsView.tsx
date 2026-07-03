"use client";

import { Fragment, useMemo, useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import {
  HQBadge,
  HQButton,
  HQEmptyState,
  HQSearchInput,
  hqInputClass,
  hqTableWrapClass,
} from "@/components/headquarters/ui";
import { ambassadorStatusOptions } from "@/lib/ambassadors";
import type { HQUser } from "@/lib/headquarters/auth";
import type { AmbassadorRecord, NomineeTicketPartnerRecord } from "@/lib/headquarters/types";

const PENDING_STATUSES = new Set(["Pending Review"]);

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function copyLink(url: string) {
  void navigator.clipboard.writeText(url);
}

type AmbassadorsViewProps = {
  nomineeLinks: NomineeTicketPartnerRecord[];
  ambassadors: AmbassadorRecord[];
  currentUser?: HQUser | null;
};

export function AmbassadorsView({
  nomineeLinks: initialNomineeLinks,
  ambassadors: initialAmbassadors,
  currentUser,
}: AmbassadorsViewProps) {
  const [nomineeLinks] = useState(initialNomineeLinks);
  const [ambassadors, setAmbassadors] = useState(initialAmbassadors);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedNomineeId, setExpandedNomineeId] = useState<string | null>(null);

  function toggleNominee(id: string) {
    setExpandedNomineeId((prev) => (prev === id ? null : id));
  }

  const filteredNominees = useMemo(() => {
    const q = search.toLowerCase();
    return nomineeLinks.filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q)
      );
    });
  }, [nomineeLinks, search]);

  const filteredApplications = useMemo(() => {
    const q = search.toLowerCase();
    return ambassadors.filter((item) => {
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.organization.toLowerCase().includes(q);
      const matchStatus = status === "all" || item.status === status;
      return matchSearch && matchStatus;
    });
  }, [ambassadors, search, status]);

  const pendingCount = ambassadors.filter((item) => PENDING_STATUSES.has(item.status)).length;

  async function updateAmbassador(id: string, nextStatus: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/headquarters/ambassadors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        ambassador?: AmbassadorRecord;
      };
      if (!res.ok || !data.success || !data.ambassador) {
        setError(data.error ?? "Could not update ambassador.");
        return;
      }
      setAmbassadors((prev) => prev.map((item) => (item.id === id ? data.ambassador! : item)));
      setMessage(`${data.ambassador.name} marked ${data.ambassador.status}.`);
    } catch {
      setError("Could not update ambassador.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <HQShell title="Ambassadors" user={currentUser}>
      <p className="mb-6 text-sm text-cream/50">
        Nominee ticket partner links are created automatically. Any logged-in Headquarters team member can approve ambassador applications below.
      </p>

      {message ? (
        <p className="mb-4 rounded-lg border border-emerald/30 bg-emerald/10 px-4 py-2 text-sm text-emerald-light">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <HQSearchInput value={search} onChange={setSearch} placeholder="Search nominees or ambassadors…" />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={hqInputClass}
        >
          <option value="all">All application statuses</option>
          {ambassadorStatusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-gold">Nominee ticket links</h2>
            <p className="mt-1 text-sm text-cream/50">
              Every nominee gets a tracked Ticketmaster partner link. Click a nominee to see the ticket
              forms filled out on their behalf. Match buyers and track commission in{" "}
              <a href="/headquarters/ticket-sales" className="text-gold hover:underline">
                Ticket Sales
              </a>
              .
            </p>
          </div>
          <HQBadge tone="gold">{filteredNominees.length} links</HQBadge>
        </div>

        {filteredNominees.length === 0 ? (
          <HQEmptyState
            title="No nominee links yet"
            description="Add nominees in Headquarters and their ticket partner links will appear here automatically."
          />
        ) : (
          <div className={hqTableWrapClass}>
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
                <tr>
                  <th className="px-4 py-3">Nominee</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Forms filled</th>
                  <th className="px-4 py-3">Tracking link</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">Last click</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {filteredNominees.map((item) => {
                  const expanded = expandedNomineeId === item.id;
                  return (
                    <Fragment key={item.id}>
                      <tr
                        className="cursor-pointer hover:bg-gold/[0.03]"
                        onClick={() => toggleNominee(item.id)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-cream">
                            <span className="mr-2 text-gold/60">{expanded ? "▾" : "▸"}</span>
                            {item.name}
                          </p>
                          <p className="pl-5 text-xs text-cream/50">{item.email || "No email on file"}</p>
                        </td>
                        <td className="px-4 py-3 text-cream/70">{item.category}</td>
                        <td className="px-4 py-3">
                          <HQBadge tone={item.leads.length > 0 ? "green" : "default"}>
                            {item.leads.length} form{item.leads.length === 1 ? "" : "s"}
                          </HQBadge>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1">
                            <a
                              href={item.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gold hover:underline"
                            >
                              Open link
                            </a>
                            <button
                              type="button"
                              onClick={() => copyLink(item.trackingUrl)}
                              className="text-left text-xs text-cream/50 hover:text-cream/80"
                            >
                              Copy link
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-cream">{item.clickCount}</td>
                        <td className="px-4 py-3 text-cream/70">{formatWhen(item.lastClickAt)}</td>
                      </tr>
                      {expanded ? (
                        <tr className="bg-black/30">
                          <td colSpan={6} className="px-4 py-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/40">
                              Ticket forms filled out for {item.name} ({item.leads.length})
                            </p>
                            {item.leads.length === 0 ? (
                              <p className="text-sm text-cream/40">
                                No ticket forms submitted yet. Forms are captured when a supporter
                                enters their info on this nominee&apos;s ticket link.
                              </p>
                            ) : (
                              <div className="overflow-x-auto rounded-lg border border-gold/10">
                                <table className="w-full min-w-[620px] text-left text-sm">
                                  <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
                                    <tr>
                                      <th className="px-4 py-2.5">Name</th>
                                      <th className="px-4 py-2.5">Email</th>
                                      <th className="px-4 py-2.5">Phone</th>
                                      <th className="px-4 py-2.5">Submitted</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gold/10">
                                    {item.leads.map((lead) => (
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
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-gold">Ambassador applications</h2>
            <p className="mt-1 text-sm text-cream/50">
              Public form submissions. Approve to activate immediately and issue a tracked ticket link.
            </p>
          </div>
          {pendingCount > 0 ? <HQBadge tone="amber">{pendingCount} pending</HQBadge> : null}
        </div>

        {filteredApplications.length === 0 ? (
          <HQEmptyState
            title="No ambassador applications yet"
            description="Applications from /ambassadors will appear here for approval."
          />
        ) : (
          <div className={hqTableWrapClass}>
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Channels</th>
                  <th className="px-4 py-3">Link</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">Purchases</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {filteredApplications.map((item) => (
                  <tr key={item.id} className="hover:bg-gold/[0.03]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-cream">{item.name}</p>
                      <p className="text-xs text-cream/50">{item.email}</p>
                    </td>
                    <td className="px-4 py-3 text-cream/70">{item.city}</td>
                    <td className="px-4 py-3 text-cream/70">{item.channels}</td>
                    <td className="px-4 py-3 text-cream/70">
                      {item.ambassadorLink ? (
                        <div className="flex flex-col gap-1">
                          <a
                            href={item.ambassadorLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold hover:underline"
                          >
                            View link
                          </a>
                          <button
                            type="button"
                            onClick={() => copyLink(item.ambassadorLink)}
                            className="text-left text-xs text-cream/50 hover:text-cream/80"
                          >
                            Copy link
                          </button>
                        </div>
                      ) : (
                        "Assigned on approval"
                      )}
                    </td>
                    <td className="px-4 py-3 text-cream">{item.clickCount}</td>
                    <td className="px-4 py-3 text-cream">{item.purchaseCount}</td>
                    <td className="px-4 py-3">
                      <HQBadge tone={item.status === "Active" ? "green" : PENDING_STATUSES.has(item.status) ? "amber" : "default"}>
                        {item.status}
                      </HQBadge>
                      {item.reviewedByName ? (
                        <p className="mt-1 text-xs text-cream/40">
                          by {item.reviewedByName}
                          {item.reviewedAt ? ` · ${formatWhen(item.reviewedAt)}` : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {PENDING_STATUSES.has(item.status) ? (
                        <div className="flex flex-wrap gap-2">
                          <HQButton
                            className="!px-3 !py-1.5 text-xs"
                            disabled={busyId === item.id}
                            onClick={() => void updateAmbassador(item.id, "Active")}
                          >
                            Approve
                          </HQButton>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => void updateAmbassador(item.id, "Denied")}
                            className="rounded-full border border-ruby/30 px-3 py-1.5 text-xs text-cream/80 hover:bg-ruby/10"
                          >
                            Deny
                          </button>
                        </div>
                      ) : item.status === "Approved" ? (
                        <HQButton
                          className="!px-3 !py-1.5 text-xs"
                          disabled={busyId === item.id}
                          onClick={() => void updateAmbassador(item.id, "Active")}
                        >
                          Activate
                        </HQButton>
                      ) : (
                        <span className="text-xs text-cream/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </HQShell>
  );
}
