"use client";

import { useMemo, useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import { SponsorOutreachEmailPreview } from "@/components/headquarters/SponsorOutreachEmailPreview";
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
import type { SponsorLead } from "@/lib/headquarters/types";
import { DEFAULT_SPONSOR_OUTREACH_COPY } from "@/lib/sponsor-outreach-email";
import { sortSponsorPackagesByPrice, sponsorPackages } from "@/lib/site";

const STATUSES = [
  "New Lead",
  "Contacted",
  "Proposal Sent",
  "Negotiation",
  "Paid",
  "Assets Received",
  "Activated",
];

type SendLinkModal =
  | { kind: "new" }
  | { kind: "lead"; lead: SponsorLead }
  | null;

type TeamMemberOption = {
  name: string;
  email: string;
};

const buyablePackages = sortSponsorPackagesByPrice(
  sponsorPackages.filter((pkg) => pkg.price > 0 && !pkg.contactOnly),
);

export function SponsorsView({
  sponsors,
  teamMembers,
}: {
  sponsors: SponsorLead[];
  teamMembers: TeamMemberOption[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [modal, setModal] = useState<SendLinkModal>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [packageId, setPackageId] = useState("");
  const [teamMember, setTeamMember] = useState("");
  const [emailCopy, setEmailCopy] = useState(DEFAULT_SPONSOR_OUTREACH_COPY);

  const previewLead = useMemo(
    () => ({
      name: name.trim() || "there",
      email: email.trim() || "",
      company: company.trim() || undefined,
    }),
    [name, email, company],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sponsors.filter((s) => {
      const matchSearch =
        !q ||
        s.company.toLowerCase().includes(q) ||
        s.contact.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.dealOwner.toLowerCase().includes(q);
      const matchStatus = status === "all" || s.status === status;
      return matchSearch && matchStatus;
    });
  }, [sponsors, search, status]);

  function resetFormFields() {
    setName("");
    setEmail("");
    setCompany("");
    setPackageId("");
    setTeamMember("");
    setEmailCopy(DEFAULT_SPONSOR_OUTREACH_COPY);
  }

  function openNewModal() {
    resetFormFields();
    setError(null);
    setMessage(null);
    setModal({ kind: "new" });
  }

  function openLeadModal(lead: SponsorLead) {
    setName(lead.contact);
    setEmail(lead.email);
    setCompany(lead.company === "—" ? "" : lead.company);
    setPackageId(lead.packageId ?? "");
    setTeamMember(lead.dealOwner === "—" ? "" : lead.dealOwner);
    setEmailCopy(DEFAULT_SPONSOR_OUTREACH_COPY);
    setError(null);
    setMessage(null);
    setModal({ kind: "lead", lead });
  }

  async function sendSponsorLink() {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/headquarters/sponsors/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          packageId: packageId || undefined,
          teamMember: teamMember.trim() || undefined,
          emailCopy: emailCopy.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not send sponsor link.");
        return;
      }

      setMessage(`Sponsor packages link sent to ${email.trim()}.`);
      setModal(null);
    } catch {
      setError("Could not send sponsor link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <HQShell title="Sponsors">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-cream/50">
          Sponsor pipeline and partnership progress. Send prospects a link to the sponsor packages page.
        </p>
        <HQButton onClick={openNewModal}>Send sponsor link</HQButton>
      </div>

      {message ? (
        <p className="mb-4 rounded-lg border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald-light">
          {message}
        </p>
      ) : null}

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
          description="Sponsor inquiries and confirmed packages will appear here. Use Send sponsor link to email a prospect directly."
        />
      ) : (
        <div className={hqTableWrapClass}>
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Deal owner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-gold/[0.03]">
                  <td className="px-4 py-3 font-medium text-cream">{s.company}</td>
                  <td className="px-4 py-3 text-cream/70">{s.contact}</td>
                  <td className="px-4 py-3 text-cream/70">
                    <a href={`mailto:${s.email}`} className="text-gold hover:underline">
                      {s.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-cream/70">{s.packageName}</td>
                  <td className="px-4 py-3 text-cream/60">{s.dealOwner}</td>
                  <td className="px-4 py-3">
                    <HQBadge tone="gold">{s.status}</HQBadge>
                  </td>
                  <td className="px-4 py-3 text-cream/60">{s.paymentStatus}</td>
                  <td className="px-4 py-3 text-cream/50">{s.notes}</td>
                  <td className="px-4 py-3">
                    <HQButton
                      variant="outline"
                      className="whitespace-nowrap"
                      onClick={() => openLeadModal(s)}
                    >
                      Send link
                    </HQButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className={`${hqPanelClass} max-h-[92vh] w-full max-w-5xl overflow-y-auto`}
          >
            <HQCardHeader
              title="Send sponsor link"
              subtitle={
                modal.kind === "lead"
                  ? `Email ${modal.lead.contact} at ${modal.lead.email}`
                  : "Email a prospect a link to the sponsor packages page"
              }
              action={
                <HQButton variant="ghost" onClick={() => setModal(null)} disabled={busy}>
                  Close
                </HQButton>
              }
            />

            <div className="grid gap-6 p-5 lg:grid-cols-2">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-cream/50">Contact name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${hqInputClass} w-full`}
                    placeholder="Contact name"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-cream/50">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${hqInputClass} w-full`}
                    placeholder="Email address"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-cream/50">Company (optional)</span>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={`${hqInputClass} w-full`}
                    placeholder="Company name"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-cream/50">Deal owner</span>
                  <select
                    value={teamMember}
                    onChange={(e) => setTeamMember(e.target.value)}
                    className={`${hqInputClass} w-full`}
                  >
                    <option value="">Select team member</option>
                    {teamMembers.map((member) => (
                      <option key={member.email} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-cream/50">Highlight package</span>
                  <select
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className={`${hqInputClass} w-full`}
                  >
                    <option value="">All packages — link to sponsors page</option>
                    {buyablePackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} — ${pkg.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-cream/50">Email copy</span>
                  <textarea
                    value={emailCopy}
                    onChange={(e) => setEmailCopy(e.target.value)}
                    rows={5}
                    className={`${hqInputClass} w-full resize-y`}
                    placeholder={DEFAULT_SPONSOR_OUTREACH_COPY}
                  />
                  <span className="mt-1 block text-[11px] text-cream/40">
                    Line breaks are preserved. Blank lines start new paragraphs. Emails and www links become clickable.
                  </span>
                </label>

                {error ? (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2 pt-2 lg:hidden">
                  <HQButton variant="outline" onClick={() => setModal(null)} disabled={busy}>
                    Cancel
                  </HQButton>
                  <HQButton onClick={() => void sendSponsorLink()} disabled={busy}>
                    {busy ? "Sending…" : "Send email"}
                  </HQButton>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-cream/45">
                  Email preview
                </p>
                <SponsorOutreachEmailPreview
                  lead={previewLead}
                  packageId={packageId || undefined}
                  emailCopy={emailCopy}
                  teamMember={teamMember || undefined}
                />
                <div className="hidden justify-end gap-2 lg:flex">
                  <HQButton variant="outline" onClick={() => setModal(null)} disabled={busy}>
                    Cancel
                  </HQButton>
                  <HQButton onClick={() => void sendSponsorLink()} disabled={busy}>
                    {busy ? "Sending…" : "Send email"}
                  </HQButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </HQShell>
  );
}
