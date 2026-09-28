"use client";

import { hqFetch } from "@/lib/headquarters/hq-fetch.client";
import { useMemo, useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import {
  HQBadge,
  HQButton,
  HQCardHeader,
  HQEmptyState,
  HQSearchInput,
  hqInputClass,
  hqPanelClass,
  hqTableWrapClass,
} from "@/components/headquarters/ui";
import { ambassadorStatusOptions } from "@/lib/ambassadors";
import type { HQUser } from "@/lib/headquarters/auth";
import type {
  AmbassadorRecord,
  NomineeTicketPartnerRecord,
  PartnerMatchedPurchase,
  TicketFormLead,
} from "@/lib/headquarters/types";
import { ticketPartnerInfo } from "@/lib/site";
import { normalizeEmail } from "@/lib/ticket-partner/reconcile";

const PENDING_STATUSES = new Set(["Pending Review"]);

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatMoney(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function copyLink(url: string) {
  void navigator.clipboard.writeText(url);
}

type PartnerDetail =
  | { kind: "nominee"; record: NomineeTicketPartnerRecord }
  | { kind: "ambassador"; record: AmbassadorRecord };

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
  const [detail, setDetail] = useState<PartnerDetail | null>(null);

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
      const res = await hqFetch("/api/headquarters/ambassadors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        ambassador?: AmbassadorRecord;
        emailed?: boolean;
        emailError?: string | null;
      };
      if (!res.ok || !data.success || !data.ambassador) {
        setError(data.error ?? "Could not update ambassador.");
        return;
      }
      setAmbassadors((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...data.ambassador!,
                // Preserve reconciliation fields from the page load; PATCH does not reload matches.
                matchedBuyers: item.matchedBuyers,
                uncreditedBuyers: item.uncreditedBuyers,
                ticketsSold: item.ticketsSold,
                salesAmount: item.salesAmount,
                payoutAmount: item.payoutAmount,
                leads: item.leads.length > 0 ? item.leads : data.ambassador!.leads,
              }
            : item,
        ),
      );
      if (data.emailError) {
        setError(data.emailError);
        setMessage(`${data.ambassador.name} marked ${data.ambassador.status}.`);
      } else if (data.emailed) {
        setMessage(
          `${data.ambassador.name} approved — tracking link emailed to ${data.ambassador.email}.`,
        );
      } else {
        setMessage(`${data.ambassador.name} marked ${data.ambassador.status}.`);
      }
    } catch {
      setError("Could not update ambassador.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <HQShell title="Ambassadors" user={currentUser}>
      <p className="mb-6 text-sm text-cream/50">
        Nominee ticket partner links are created automatically. Approving an ambassador emails them
        their tracking link immediately. Click a name to see Ticketmaster purchases matched to their
        ticket forms and the {ticketPartnerInfo.commissionPercent}% payout due. Any logged-in
        Headquarters team member can review applications below.
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
              Every nominee gets a tracked Ticketmaster partner link. Click a nominee to see forms,
              matched purchases, and payout. Full import tools live in{" "}
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
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
                <tr>
                  <th className="px-4 py-3">Nominee</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Forms</th>
                  <th className="px-4 py-3">Tickets</th>
                  <th className="px-4 py-3">Payout</th>
                  <th className="px-4 py-3">Tracking link</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">Last click</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {filteredNominees.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer hover:bg-gold/[0.03]"
                    onClick={() => setDetail({ kind: "nominee", record: item })}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-cream">
                        <span className="mr-2 text-gold/60">▸</span>
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
                    <td className="px-4 py-3 text-cream">{item.ticketsSold}</td>
                    <td className="px-4 py-3 text-gold">{formatMoney(item.payoutAmount)}</td>
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
                ))}
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
              Public form submissions. Approve to activate, issue a tracked ticket link, and email it
              to the ambassador. Click a name for matched purchases and payout.
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
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Channels</th>
                  <th className="px-4 py-3">Link</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">Tickets</th>
                  <th className="px-4 py-3">Payout</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {filteredApplications.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer hover:bg-gold/[0.03]"
                    onClick={() => setDetail({ kind: "ambassador", record: item })}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-cream">
                        <span className="mr-2 text-gold/60">▸</span>
                        {item.name}
                      </p>
                      <p className="pl-5 text-xs text-cream/50">{item.email}</p>
                    </td>
                    <td className="px-4 py-3 text-cream/70">{item.city}</td>
                    <td className="px-4 py-3 text-cream/70">{item.channels}</td>
                    <td className="px-4 py-3 text-cream/70" onClick={(e) => e.stopPropagation()}>
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
                    <td className="px-4 py-3 text-cream">{item.ticketsSold}</td>
                    <td className="px-4 py-3 text-gold">{formatMoney(item.payoutAmount)}</td>
                    <td className="px-4 py-3">
                      <HQBadge
                        tone={
                          item.status === "Active"
                            ? "green"
                            : PENDING_STATUSES.has(item.status)
                              ? "amber"
                              : "default"
                        }
                      >
                        {item.status}
                      </HQBadge>
                      {item.reviewedByName ? (
                        <p className="mt-1 text-xs text-cream/40">
                          by {item.reviewedByName}
                          {item.reviewedAt ? ` · ${formatWhen(item.reviewedAt)}` : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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

      {detail ? (
        <PartnerPayoutModal detail={detail} onClose={() => setDetail(null)} />
      ) : null}
    </HQShell>
  );
}

function leadNameForEmail(leads: TicketFormLead[], email: string): string {
  const normalized = normalizeEmail(email);
  const match = leads.find((lead) => normalizeEmail(lead.buyerEmail) === normalized);
  return match?.buyerName || "—";
}

function unmatchedFormLeads(
  leads: TicketFormLead[],
  matched: PartnerMatchedPurchase[],
  uncredited: PartnerMatchedPurchase[],
): TicketFormLead[] {
  const creditedEmails = new Set(
    [...matched, ...uncredited].map((buyer) => normalizeEmail(buyer.buyerEmail)).filter(Boolean),
  );
  return leads.filter((lead) => {
    const email = normalizeEmail(lead.buyerEmail);
    return email && !creditedEmails.has(email);
  });
}

function PartnerPayoutModal({
  detail,
  onClose,
}: {
  detail: PartnerDetail;
  onClose: () => void;
}) {
  const record = detail.record;
  const trackingUrl =
    detail.kind === "nominee" ? detail.record.trackingUrl : detail.record.ambassadorLink;
  const subtitle =
    detail.kind === "nominee"
      ? detail.record.category
      : `${detail.record.city}${detail.record.email ? ` · ${detail.record.email}` : ""}`;
  const unmatched = unmatchedFormLeads(
    record.leads,
    record.matchedBuyers,
    record.uncreditedBuyers,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-payout-title"
    >
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close" />
      <div
        className={`${hqPanelClass} relative z-10 max-h-[92vh] w-full max-w-4xl overflow-y-auto`}
      >
        <HQCardHeader
          title={record.name}
          subtitle={subtitle}
          action={
            <HQButton variant="ghost" onClick={onClose}>
              Close
            </HQButton>
          }
        />

        <div className="space-y-6 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryStat label="Forms filled" value={String(record.leads.length)} />
            <SummaryStat label="Tickets credited" value={String(record.ticketsSold)} />
            <SummaryStat label="Sales attributed" value={formatMoney(record.salesAmount)} />
            <SummaryStat
              label={`Payout (${ticketPartnerInfo.commissionPercent}%)`}
              value={formatMoney(record.payoutAmount)}
              accent
            />
          </div>

          {trackingUrl ? (
            <p className="text-sm text-cream/60">
              Tracking link:{" "}
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                {trackingUrl}
              </a>
            </p>
          ) : null}

          <section>
            <h3
              id="partner-payout-title"
              className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/40"
            >
              Credited Ticketmaster purchases ({record.matchedBuyers.length})
            </h3>
            {record.matchedBuyers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gold/20 px-4 py-6 text-sm text-cream/45">
                No Ticketmaster emails matched this partner yet. Form submissions still appear below.
                Payout due is {formatMoney(0)}.
              </p>
            ) : (
              <div className={hqTableWrapClass}>
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
                    <tr>
                      <th className="px-4 py-2.5">Form name</th>
                      <th className="px-4 py-2.5">Ticketmaster email</th>
                      <th className="px-4 py-2.5">Qty</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/10">
                    {record.matchedBuyers.map((buyer) => (
                      <tr key={buyer.purchaseId} className="hover:bg-gold/[0.03]">
                        <td className="px-4 py-2.5 text-cream">
                          {leadNameForEmail(record.leads, buyer.buyerEmail)}
                        </td>
                        <td className="px-4 py-2.5 text-cream/70">{buyer.buyerEmail || "—"}</td>
                        <td className="px-4 py-2.5 text-cream/70">{buyer.quantity}</td>
                        <td className="px-4 py-2.5 text-cream/70">{formatMoney(buyer.amount)}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs text-cream/50">{buyer.matchType}</span>
                          {buyer.ambiguous ? (
                            <span className="ml-2 inline-flex">
                              <HQBadge tone="amber">earliest form</HQBadge>
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {record.uncreditedBuyers.length > 0 ? (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/40">
                Form filled — credited to another partner ({record.uncreditedBuyers.length})
              </h3>
              <div className={hqTableWrapClass}>
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
                    <tr>
                      <th className="px-4 py-2.5">Form name</th>
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/10">
                    {record.uncreditedBuyers.map((buyer) => (
                      <tr key={`uc-${buyer.purchaseId}`} className="hover:bg-gold/[0.03]">
                        <td className="px-4 py-2.5 text-cream">
                          {leadNameForEmail(record.leads, buyer.buyerEmail)}
                        </td>
                        <td className="px-4 py-2.5 text-cream/70">{buyer.buyerEmail || "—"}</td>
                        <td className="px-4 py-2.5 text-cream/70">{buyer.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cream/40">
              Form emails not in Ticketmaster import ({unmatched.length})
            </h3>
            {unmatched.length === 0 ? (
              <p className="text-sm text-cream/40">
                {record.leads.length === 0
                  ? "No ticket forms submitted for this partner yet."
                  : "Every form email on this partner also appears in the Ticketmaster import."}
              </p>
            ) : (
              <div className={hqTableWrapClass}>
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
                    <tr>
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5">Phone</th>
                      <th className="px-4 py-2.5">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/10">
                    {unmatched.map((lead) => (
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
          </section>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gold/15 bg-black/30 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-cream/40">{label}</p>
      <p className={`mt-1 font-display text-xl ${accent ? "text-gold" : "text-cream"}`}>{value}</p>
    </div>
  );
}
