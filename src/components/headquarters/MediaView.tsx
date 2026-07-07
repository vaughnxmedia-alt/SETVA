"use client";

import { hqFetch } from "@/lib/headquarters/hq-fetch.client";
import { useMemo, useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import { MediaCredentialApprovalEmailPreview } from "@/components/headquarters/MediaCredentialApprovalEmailPreview";
import {
  HQBadge,
  HQButton,
  HQCardHeader,
  HQEmptyState,
  HQSearchInput,
  hqInputClass,
  hqPanelClass,
} from "@/components/headquarters/ui";
import { DEFAULT_MEDIA_CHECK_IN_TIME } from "@/lib/media-credential-approval-email";
import { applicationStatusOptions, type MediaCredentialApplication } from "@/lib/media-credentials";
import type { MediaCredentialTeamMemberRecord } from "@/lib/media-credential-team";
import { formatMediaTeamMemberAddress } from "@/lib/media-credential-team";

type MediaViewProps = {
  applications: MediaCredentialApplication[];
  teamMemberSubmissions: MediaCredentialTeamMemberRecord[];
};

type ModalMode =
  | { kind: "approve"; application: MediaCredentialApplication }
  | { kind: "delete"; application: MediaCredentialApplication }
  | null;

function statusTone(status: string): "default" | "gold" | "green" | "amber" | "red" {
  if (status === "Approved" || status === "Approved with Restrictions") return "green";
  if (status === "Pending Review") return "amber";
  if (status === "Denied") return "red";
  return "default";
}

function formatWhen(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function MediaView({
  applications: initialApplications,
  teamMemberSubmissions,
}: MediaViewProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<ModalMode>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Approve modal fields.
  const [checkInTime, setCheckInTime] = useState("");
  const [checkInLocation, setCheckInLocation] = useState("");

  const approvePreviewApplication = useMemo(() => {
    if (modal?.kind !== "approve") return null;
    return {
      id: modal.application.id,
      fullName: modal.application.fullName,
      email: modal.application.email,
      mediaOutlet: modal.application.mediaOutlet,
      teamMemberRoster: modal.application.teamMemberRoster ?? [],
    };
  }, [modal]);

  const submissionsByApplication = useMemo(() => {
    const map = new Map<string, MediaCredentialTeamMemberRecord[]>();
    for (const submission of teamMemberSubmissions) {
      const current = map.get(submission.applicationId) ?? [];
      current.push(submission);
      map.set(submission.applicationId, current);
    }
    return map;
  }, [teamMemberSubmissions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return applications.filter((app) => {
      const matchSearch =
        !q ||
        [app.mediaOutlet, app.fullName, app.email].join(" ").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || app.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [applications, search, statusFilter]);

  const pendingCount = applications.filter((app) => app.status === "Pending Review").length;

  function openApprove(application: MediaCredentialApplication) {
    setCheckInTime(application.arrivalTime ?? DEFAULT_MEDIA_CHECK_IN_TIME);
    setCheckInLocation(application.pickupLocation ?? "");
    setError(null);
    setModal({ kind: "approve", application });
  }

  function openDelete(application: MediaCredentialApplication) {
    setError(null);
    setModal({ kind: "delete", application });
  }

  async function patchStatus(
    application: MediaCredentialApplication,
    status: string,
    opts: { sendEmail: boolean; checkInTime?: string; checkInLocation?: string },
  ) {
    setBusyId(application.id);
    setError(null);
    try {
      const res = await hqFetch(`/api/headquarters/media/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...opts }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        application?: MediaCredentialApplication;
        emailed?: boolean;
      };
      if (!res.ok || !data.success || !data.application) {
        setError(data.error ?? "Could not update application.");
        return false;
      }
      const updated = data.application;
      setApplications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(
        `${updated.fullName} marked ${updated.status}${data.emailed ? " and emailed" : ""}.`,
      );
      return true;
    } catch {
      setError("Could not update application.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function confirmApprove() {
    if (modal?.kind !== "approve") return;
    const ok = await patchStatus(modal.application, "Approved", {
      sendEmail: true,
      checkInTime,
      checkInLocation,
    });
    if (ok) setModal(null);
  }

  async function confirmDelete() {
    if (modal?.kind !== "delete") return;
    const application = modal.application;
    setBusyId(application.id);
    setError(null);
    try {
      const res = await hqFetch(`/api/headquarters/media/${application.id}`, { method: "DELETE" });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Could not delete application.");
        return;
      }
      setApplications((prev) => prev.filter((item) => item.id !== application.id));
      setMessage(`${application.fullName} deleted.`);
      setModal(null);
    } catch {
      setError("Could not delete application.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <HQShell title="Media Credentials">
      <p className="mb-4 text-sm text-cream/50">
        Review media applications, approve and email a sign-in confirmation, or delete. Standard
        credentials are Red Carpet Only.
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

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <HQSearchInput value={search} onChange={setSearch} placeholder="Search outlet, name, or email…" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={hqInputClass}>
          <option value="all">All statuses</option>
          {applicationStatusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {pendingCount > 0 ? <HQBadge tone="amber">{pendingCount} pending</HQBadge> : null}
      </div>

      {filtered.length === 0 ? (
        <HQEmptyState
          title="No media applications yet"
          description="Media credential submissions will appear here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((app) => {
            const approved = app.status === "Approved" || app.status === "Approved with Restrictions";
            const roster = app.teamMemberRoster ?? [];
            const submissions = submissionsByApplication.get(app.id) ?? [];
            return (
              <div
                key={app.id}
                className="card-glow rounded-xl border border-gold/20 bg-ink-deep/60 p-4 transition hover:border-gold/35"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-cream">{app.mediaOutlet}</p>
                  <HQBadge tone={statusTone(app.status)}>{app.status}</HQBadge>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-cream/35">Contact</dt>
                    <dd className="text-cream/75">{app.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-cream/35">Email</dt>
                    <dd className="break-all text-cream/75">
                      <a href={`mailto:${app.email}`} className="text-gold hover:underline">
                        {app.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-cream/35">Phone</dt>
                    <dd className="text-cream/75">{app.phone || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-cream/35">Audience</dt>
                    <dd className="text-cream/75">{app.totalFollowers || app.averageReach || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-cream/35">Coverage</dt>
                    <dd className="text-cream/75">{app.coverageTypes.join(", ") || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-cream/35">Credential</dt>
                    <dd className="text-cream/75">{app.credentialType}</dd>
                  </div>
                  <div>
                    <dt className="text-cream/35">Team size</dt>
                    <dd className="text-cream/75">{app.teamMembers || "—"}</dd>
                  </div>
                  {roster.length > 0 ? (
                    <div className="col-span-2">
                      <dt className="text-cream/35">Named team members</dt>
                      <dd className="text-cream/75">{roster.map((member) => member.name).join(", ")}</dd>
                    </div>
                  ) : null}
                  {submissions.length > 0 ? (
                    <div className="col-span-2">
                      <dt className="text-cream/35">Registered crew</dt>
                      <dd className="space-y-2 text-cream/75">
                        {submissions.map((member) => (
                          <div
                            key={member.id}
                            className="rounded-lg border border-gold/10 bg-black/20 px-3 py-2 text-xs"
                          >
                            <p className="font-medium text-cream">{member.fullName}</p>
                            <p>{member.email} · {member.phone}</p>
                            <p className="mt-1 whitespace-pre-line text-cream/55">
                              {formatMediaTeamMemberAddress(member)}
                            </p>
                          </div>
                        ))}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-cream/35">Confirmation email</dt>
                    <dd className="text-cream/75">{formatWhen(app.lastStatusEmailAt)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <HQButton
                    onClick={() => openApprove(app)}
                    disabled={busyId === app.id}
                  >
                    {approved ? "Re-send confirmation" : "Approve"}
                  </HQButton>
                  {app.status !== "Denied" ? (
                    <HQButton
                      variant="outline"
                      onClick={() => void patchStatus(app, "Denied", { sendEmail: false })}
                      disabled={busyId === app.id}
                    >
                      Deny
                    </HQButton>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openDelete(app)}
                    disabled={busyId === app.id}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className={`${hqPanelClass} max-h-[92vh] w-full overflow-y-auto ${
              modal.kind === "approve" ? "max-w-5xl" : "max-w-lg"
            }`}
          >
            <HQCardHeader
              title={
                modal.kind === "approve"
                  ? modal.application.status === "Approved" ||
                    modal.application.status === "Approved with Restrictions"
                    ? "Re-send approval email"
                    : "Approve media credential"
                  : "Delete application"
              }
              subtitle={`${modal.application.fullName} · ${modal.application.mediaOutlet}`}
              action={
                <HQButton variant="ghost" onClick={() => setModal(null)} disabled={busyId !== null}>
                  Close
                </HQButton>
              }
            />

            <div className={modal.kind === "approve" ? "grid gap-6 p-5 lg:grid-cols-2" : "p-5"}>
              {modal.kind === "approve" ? (
                <>
                  <div className="space-y-4">
                    <p className="text-sm text-cream/70">
                      Review the automatic approval email below. Update check-in details if
                      needed, then confirm to approve and send to{" "}
                      <strong className="text-cream">{modal.application.email}</strong>.
                    </p>
                    <label className="block">
                      <span className="mb-1 block text-xs text-cream/50">Media check-in time</span>
                      <input
                        type="text"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        placeholder={DEFAULT_MEDIA_CHECK_IN_TIME}
                        className={`${hqInputClass} w-full`}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-cream/50">
                        Media check-in location
                      </span>
                      <input
                        type="text"
                        value={checkInLocation}
                        onChange={(e) => setCheckInLocation(e.target.value)}
                        placeholder="e.g. Jefferson Theatre — Media Check-In (front entrance)"
                        className={`${hqInputClass} w-full`}
                      />
                    </label>
                  </div>

                  {approvePreviewApplication ? (
                    <MediaCredentialApprovalEmailPreview
                      application={approvePreviewApplication}
                      checkInTime={checkInTime}
                      checkInLocation={checkInLocation}
                    />
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-cream/80">
                  Are you sure you want to delete the media application for{" "}
                  <strong className="text-cream">{modal.application.fullName}</strong> (
                  {modal.application.mediaOutlet})? This cannot be undone.
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-gold/10 px-5 py-4">
              <HQButton variant="outline" onClick={() => setModal(null)} disabled={busyId !== null}>
                {modal.kind === "delete" ? "No, keep it" : "Cancel"}
              </HQButton>
              {modal.kind === "approve" ? (
                <HQButton onClick={() => void confirmApprove()} disabled={busyId !== null}>
                  {busyId !== null ? "Sending…" : "Confirm & send"}
                </HQButton>
              ) : (
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={busyId !== null}
                  className="rounded-lg border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-200 transition hover:bg-red-500/30 disabled:opacity-50"
                >
                  {busyId !== null ? "Deleting…" : "Yes, delete"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </HQShell>
  );
}
