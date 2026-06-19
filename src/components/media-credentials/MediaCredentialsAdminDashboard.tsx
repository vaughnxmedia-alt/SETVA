"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicErrorAlert } from "@/components/PublicErrorAlert";
import {
  applicationStatusOptions,
  credentialTypeOptions,
  defaultMediaCredentialCoverageGuidelines,
  mediaCredentialAccessZones,
  type ApplicationStatus,
  type MediaCredentialApplication,
} from "@/lib/media-credentials";
import { montCityNetwork, site } from "@/lib/site";

const fieldClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-cream outline-none focus:border-gold/40";
const textareaClass = `${fieldClass} min-h-[96px] resize-y`;
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-gold/80";

type AdminFields = Pick<
  MediaCredentialApplication,
  | "credentialType"
  | "status"
  | "internalNotes"
  | "coverageGuidelines"
  | "checkInInstructions"
  | "parkingInformation"
  | "contactInformation"
  | "arrivalTime"
  | "pickupLocation"
  | "approvedCrewSize"
  | "credentialNumber"
  | "seatingAssignment"
  | "mediaDirectoryListing"
  | "publishedArticles"
  | "photos"
  | "videos"
  | "socialMediaPosts"
  | "mentions"
>;

function pickAdminFields(application: MediaCredentialApplication): AdminFields {
  return {
    credentialType: application.credentialType,
    status: application.status,
    internalNotes: application.internalNotes,
    coverageGuidelines: application.coverageGuidelines,
    checkInInstructions: application.checkInInstructions,
    parkingInformation: application.parkingInformation,
    contactInformation: application.contactInformation,
    arrivalTime: application.arrivalTime,
    pickupLocation: application.pickupLocation,
    approvedCrewSize: application.approvedCrewSize,
    credentialNumber: application.credentialNumber,
    seatingAssignment: application.seatingAssignment,
    mediaDirectoryListing: application.mediaDirectoryListing,
    publishedArticles: application.publishedArticles,
    photos: application.photos,
    videos: application.videos,
    socialMediaPosts: application.socialMediaPosts,
    mentions: application.mentions,
  };
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value.trim()) return null;
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className="mt-1 text-sm text-cream/80">{value}</p>
    </div>
  );
}

export function MediaCredentialsAdminDashboard() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [applications, setApplications] = useState<MediaCredentialApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminFields | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">(
    "Pending Review",
  );
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selected = useMemo(
    () => applications.find((app) => app.id === selectedId) ?? null,
    [applications, selectedId],
  );

  const filteredApplications = useMemo(() => {
    if (statusFilter === "All") return applications;
    return applications.filter((app) => app.status === statusFilter);
  }, [applications, statusFilter]);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    try {
      const res = await fetch("/api/media-credentials/admin/applications");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setApiError(true);
        return;
      }
      setAuthenticated(true);
      const nextApplications = data.applications ?? [];
      setApplications(nextApplications);
      setSelectedId((current) => current ?? nextApplications[0]?.id ?? null);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (selected) {
      setDraft(pickAdminFields(selected));
    }
  }, [selected]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/media-credentials/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setLoginError(true);
        return;
      }
      setAuthenticated(true);
      setPassword("");
      await loadApplications();
    } catch {
      setLoginError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/media-credentials/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setApplications([]);
    setSelectedId(null);
    setDraft(null);
  }

  function updateDraft<K extends keyof AdminFields>(key: K, value: AdminFields[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveApplication(sendStatusEmail: boolean) {
    if (!selected || !draft) return;
    setLoading(true);
    setApiError(false);
    setSaveMessage(null);
    try {
      const res = await fetch(
        `/api/media-credentials/admin/applications/${selected.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...draft, sendStatusEmail }),
        },
      );
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setApiError(true);
        return;
      }
      const updated = data.application as MediaCredentialApplication;
      setApplications((current) =>
        current.map((app) => (app.id === updated.id ? updated : app)),
      );
      setDraft(pickAdminFields(updated));
      setSaveMessage(
        sendStatusEmail
          ? "Saved and status email sent."
          : "Application saved.",
      );
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }

  if (authenticated === null && loading) {
    return <p className="text-cream/70">Loading…</p>;
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-gold/20 bg-ink-deep/80 p-8">
        <h1 className="font-display text-2xl text-cream">Media credentials admin</h1>
        <p className="mt-2 text-sm text-cream/65">
          Internal review for {site.event.title}.
        </p>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <label className="block">
            <span className={labelClass}>Admin password</span>
            <input
              type="password"
              className={fieldClass}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {loginError && (
            <p className="text-sm text-ruby-light">Invalid password.</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-cream">Media credentials</h1>
          <p className="mt-1 text-sm text-cream/60">
            Review applications, issue credentials, and track post-event coverage.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-cream/80 hover:border-gold/40"
        >
          Sign out
        </button>
      </div>

      <div className="rounded-2xl border border-gold/15 bg-black/20 p-4 text-sm text-cream/75">
        <p className="font-semibold text-gold">Access zones</p>
        <ul className="mt-3 space-y-2">
          {mediaCredentialAccessZones.map((zone) => (
            <li key={zone.title}>
              <span className="font-medium text-cream">{zone.title}:</span>{" "}
              {zone.policy}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-gold/15 bg-black/20 p-4 text-sm text-cream/75">
        <p className="font-semibold text-gold">Event day check-in</p>
        <p className="mt-2">
          Verify government-issued ID, approval confirmation email, and approved crew
          size. Standard credentials are Red Carpet Only.
        </p>
      </div>

      {apiError && <PublicErrorAlert />}
      {saveMessage && (
        <p className="rounded-xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-cream">
          {saveMessage}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-white/10 bg-ink-deep/70 p-4">
          <label className="block">
            <span className={labelClass}>Filter by status</span>
            <select
              className={fieldClass}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ApplicationStatus | "All")
              }
            >
              <option value="All">All</option>
              {applicationStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 max-h-[70vh] space-y-2 overflow-y-auto">
            {filteredApplications.length === 0 ? (
              <p className="text-sm text-cream/50">No applications in this view.</p>
            ) : (
              filteredApplications.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelectedId(app.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    selectedId === app.id
                      ? "border-gold/50 bg-gold/10"
                      : "border-white/10 bg-black/20 hover:border-gold/25"
                  }`}
                >
                  <p className="text-sm font-semibold text-cream">{app.fullName}</p>
                  <p className="text-xs text-cream/55">{app.mediaOutlet}</p>
                  <p className="mt-1 text-xs text-gold">{app.status}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {selected && draft ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-ink-deep/70 p-6">
              <h2 className="font-display text-xl text-cream">{selected.fullName}</h2>
              <p className="mt-1 text-sm text-cream/60">
                Submitted {new Date(selected.submittedAt).toLocaleString()}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <DetailField label="Email" value={selected.email} />
                <DetailField label="Phone" value={selected.phone} />
                <DetailField label="City / state" value={selected.cityState} />
                <DetailField label="Outlet" value={selected.mediaOutlet} />
                <DetailField label="Website" value={selected.website} />
                <DetailField label="Instagram" value={selected.instagram} />
                <DetailField label="TikTok" value={selected.tiktok} />
                <DetailField label="YouTube" value={selected.youtube} />
                <DetailField label="Facebook" value={selected.facebook} />
                <DetailField label="Followers" value={selected.totalFollowers} />
                <DetailField label="Average reach" value={selected.averageReach} />
                <DetailField label="Team members requested" value={selected.teamMembers} />
                <DetailField label="Portfolio" value={selected.portfolioLink} />
                <DetailField label="Previous coverage" value={selected.previousCoverageLink} />
                <DetailField label="Emergency contact" value={`${selected.emergencyContactName} · ${selected.emergencyContactPhone}`} />
              </div>
              <div className="mt-4">
                <p className={labelClass}>Coverage types</p>
                <p className="mt-1 text-sm text-cream/80">
                  {selected.coverageTypes.join(", ")}
                </p>
              </div>
              <div className="mt-4">
                <DetailField label="Equipment" value={selected.equipment} />
                <DetailField label="Comments" value={selected.additionalComments} />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-ink-deep/70 p-6">
              <h3 className="font-display text-lg text-cream">Review &amp; credential</h3>
              <p className="mt-1 text-sm text-cream/55">
                Verify website, social channels, previous work, audience relevance,
                team size, and equipment requests. Standard credentials are Red Carpet
                Only. Lobby access is granted separately — email the applicant if
                approved.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Credential type</span>
                  <select
                    className={fieldClass}
                    value={draft.credentialType}
                    onChange={(event) =>
                      updateDraft("credentialType", event.target.value as AdminFields["credentialType"])
                    }
                  >
                    {credentialTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Application status</span>
                  <select
                    className={fieldClass}
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft("status", event.target.value as ApplicationStatus)
                    }
                  >
                    {applicationStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Internal notes</span>
                  <textarea
                    className={textareaClass}
                    value={draft.internalNotes}
                    onChange={(event) => updateDraft("internalNotes", event.target.value)}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Coverage guidelines</span>
                  <textarea
                    className={textareaClass}
                    value={draft.coverageGuidelines}
                    onChange={(event) => updateDraft("coverageGuidelines", event.target.value)}
                    placeholder={defaultMediaCredentialCoverageGuidelines}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Check-in instructions</span>
                  <textarea
                    className={textareaClass}
                    value={draft.checkInInstructions}
                    onChange={(event) => updateDraft("checkInInstructions", event.target.value)}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Parking information</span>
                  <textarea
                    className={textareaClass}
                    value={draft.parkingInformation}
                    onChange={(event) => updateDraft("parkingInformation", event.target.value)}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Contact information</span>
                  <textarea
                    className={textareaClass}
                    value={draft.contactInformation}
                    onChange={(event) => updateDraft("contactInformation", event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Arrival time</span>
                  <input
                    className={fieldClass}
                    value={draft.arrivalTime}
                    onChange={(event) => updateDraft("arrivalTime", event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Pickup location</span>
                  <input
                    className={fieldClass}
                    value={draft.pickupLocation}
                    onChange={(event) => updateDraft("pickupLocation", event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Approved crew size</span>
                  <input
                    className={fieldClass}
                    value={draft.approvedCrewSize}
                    onChange={(event) => updateDraft("approvedCrewSize", event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Credential number</span>
                  <input
                    className={fieldClass}
                    value={draft.credentialNumber}
                    onChange={(event) => updateDraft("credentialNumber", event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Seating assignment</span>
                  <input
                    className={fieldClass}
                    value={draft.seatingAssignment}
                    onChange={(event) => updateDraft("seatingAssignment", event.target.value)}
                  />
                </label>
                <label className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    checked={draft.mediaDirectoryListing}
                    onChange={(event) =>
                      updateDraft("mediaDirectoryListing", event.target.checked)
                    }
                  />
                  <span className="text-sm text-cream/80">Media directory listing</span>
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void saveApplication(false)}
                  className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-cream hover:border-gold/60 disabled:opacity-60"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void saveApplication(true)}
                  className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-black disabled:opacity-60"
                >
                  Save &amp; send status email
                </button>
              </div>
              {selected.lastStatusEmailAt && (
                <p className="mt-3 text-xs text-cream/45">
                  Last status email: {new Date(selected.lastStatusEmailAt).toLocaleString()}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-ink-deep/70 p-6">
              <h3 className="font-display text-lg text-cream">Post-event reporting</h3>
              <p className="mt-1 text-sm text-cream/55">
                Track published articles, photos, videos, social posts, and mentions.
              </p>
              <div className="mt-6 grid gap-4">
                <label className="block">
                  <span className={labelClass}>Published articles</span>
                  <textarea
                    className={textareaClass}
                    value={draft.publishedArticles}
                    onChange={(event) => updateDraft("publishedArticles", event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Photos</span>
                  <textarea
                    className={textareaClass}
                    value={draft.photos}
                    onChange={(event) => updateDraft("photos", event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Videos</span>
                  <textarea
                    className={textareaClass}
                    value={draft.videos}
                    onChange={(event) => updateDraft("videos", event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Social media posts</span>
                  <textarea
                    className={textareaClass}
                    value={draft.socialMediaPosts}
                    onChange={(event) => updateDraft("socialMediaPosts", event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Mentions</span>
                  <textarea
                    className={textareaClass}
                    value={draft.mentions}
                    onChange={(event) => updateDraft("mentions", event.target.value)}
                  />
                </label>
              </div>
            </section>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-ink-deep/70 p-8 text-cream/60">
            Select an application to review.
          </div>
        )}
      </div>
    </div>
  );
}
