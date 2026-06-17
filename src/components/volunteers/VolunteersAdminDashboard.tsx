"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicErrorAlert } from "@/components/PublicErrorAlert";
import {
  assignedCategoryOptions,
  orientationStatusOptions,
  volunteerCategoryOptions,
  volunteerRoleOptions,
  volunteerStatusOptions,
  type VolunteerRegistration,
  type VolunteerStatus,
} from "@/lib/volunteers";
import { site } from "@/lib/site";

const fieldClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-cream outline-none focus:border-gold/40";
const textareaClass = `${fieldClass} min-h-[96px] resize-y`;
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-gold/80";

type AdminFields = Pick<
  VolunteerRegistration,
  | "status"
  | "assignedRole"
  | "assignedCategory"
  | "shiftDate"
  | "shiftTime"
  | "reportTime"
  | "reportLocation"
  | "supervisorName"
  | "internalNotes"
  | "orientationStatus"
  | "dressCode"
  | "parkingCheckInInstructions"
  | "conductExpectations"
  | "confirmedArrivalTime"
  | "completedShift"
  | "supervisorNotes"
  | "thankYouEmailSent"
  | "eligibleForFutureList"
  | "volunteerHoursCompleted"
>;

function pickAdminFields(registration: VolunteerRegistration): AdminFields {
  return {
    status: registration.status,
    assignedRole: registration.assignedRole,
    assignedCategory: registration.assignedCategory,
    shiftDate: registration.shiftDate,
    shiftTime: registration.shiftTime,
    reportTime: registration.reportTime,
    reportLocation: registration.reportLocation,
    supervisorName: registration.supervisorName,
    internalNotes: registration.internalNotes,
    orientationStatus: registration.orientationStatus,
    dressCode: registration.dressCode,
    parkingCheckInInstructions: registration.parkingCheckInInstructions,
    conductExpectations: registration.conductExpectations,
    confirmedArrivalTime: registration.confirmedArrivalTime,
    completedShift: registration.completedShift,
    supervisorNotes: registration.supervisorNotes,
    thankYouEmailSent: registration.thankYouEmailSent,
    eligibleForFutureList: registration.eligibleForFutureList,
    volunteerHoursCompleted: registration.volunteerHoursCompleted,
  };
}

type Summary = {
  total: number;
  pending: number;
  approved: number;
  confirmed: number;
  checkedIn: number;
  completed: number;
  noShows: number;
};

export function VolunteersAdminDashboard() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [registrations, setRegistrations] = useState<VolunteerRegistration[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminFields | null>(null);
  const [statusFilter, setStatusFilter] = useState<VolunteerStatus | "All">("Pending Review");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selected = useMemo(
    () => registrations.find((reg) => reg.id === selectedId) ?? null,
    [registrations, selectedId],
  );

  const filtered = useMemo(() => {
    return registrations.filter((reg) => {
      if (statusFilter !== "All" && reg.status !== statusFilter) return false;
      if (categoryFilter !== "All" && !reg.volunteerCategories.includes(categoryFilter as (typeof volunteerCategoryOptions)[number])) {
        return false;
      }
      if (availabilityFilter !== "All" && !reg.availabilityWindows.includes(availabilityFilter)) {
        return false;
      }
      return true;
    });
  }, [registrations, statusFilter, categoryFilter, availabilityFilter]);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    try {
      const res = await fetch("/api/volunteers/admin/registrations");
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
      setRegistrations(data.registrations ?? []);
      setSummary(data.summary ?? null);
      setSelectedId((current) => current ?? data.registrations?.[0]?.id ?? null);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  useEffect(() => {
    if (selected) setDraft(pickAdminFields(selected));
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
      await loadRegistrations();
    } catch {
      setLoginError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/media-credentials/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setRegistrations([]);
    setSelectedId(null);
    setDraft(null);
  }

  function updateDraft<K extends keyof AdminFields>(key: K, value: AdminFields[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveRegistration(sendStatusEmail: boolean) {
    if (!selected || !draft) return;
    setLoading(true);
    setApiError(false);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/volunteers/admin/registrations/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, sendStatusEmail }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setApiError(true);
        return;
      }
      const updated = data.registration as VolunteerRegistration;
      setRegistrations((current) =>
        current.map((reg) => (reg.id === updated.id ? updated : reg)),
      );
      setDraft(pickAdminFields(updated));
      setSaveMessage(sendStatusEmail ? "Saved and status email sent." : "Registration saved.");
      await loadRegistrations();
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }

  function quickStatus(status: VolunteerStatus) {
    if (!draft) return;
    updateDraft("status", status);
  }

  if (authenticated === null && loading) {
    return <p className="text-cream/70">Loading…</p>;
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-gold/20 bg-ink-deep/80 p-8">
        <h1 className="font-display text-2xl text-cream">Volunteer admin</h1>
        <p className="mt-2 text-sm text-cream/65">Internal review for {site.event.title}.</p>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <label className="block">
            <span className={labelClass}>Admin password</span>
            <input type="password" className={fieldClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {loginError && <p className="text-sm text-ruby-light">Invalid password.</p>}
          <button type="submit" disabled={loading || !password} className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black disabled:opacity-60">
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
          <h1 className="font-display text-3xl text-cream">Volunteers</h1>
          <p className="mt-1 text-sm text-cream/60">
            Pre-event, event day, and post-event volunteer management.
          </p>
        </div>
        <button type="button" onClick={() => void handleLogout()} className="rounded-full border border-white/15 px-4 py-2 text-sm text-cream/80 hover:border-gold/40">
          Sign out
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            ["Total", summary.total],
            ["Pending", summary.pending],
            ["Approved", summary.approved],
            ["Confirmed", summary.confirmed],
            ["Checked in", summary.checkedIn],
            ["Completed", summary.completed],
            ["No-shows", summary.noShows],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl border border-gold/15 bg-black/25 px-4 py-3 text-center">
              <p className="text-2xl font-semibold text-gold">{value as number}</p>
              <p className="text-xs text-cream/55">{label as string}</p>
            </div>
          ))}
        </div>
      )}

      {apiError && <PublicErrorAlert />}
      {saveMessage && (
        <p className="rounded-xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-cream">{saveMessage}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-white/10 bg-ink-deep/70 p-4 space-y-4">
          <label className="block">
            <span className={labelClass}>Status</span>
            <select className={fieldClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as VolunteerStatus | "All")}>
              <option value="All">All</option>
              {volunteerStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Category</span>
            <select className={fieldClass} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All">All</option>
              {volunteerCategoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Availability</span>
            <select className={fieldClass} value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
              <option value="All">All</option>
              {["Weekdays", "Weekends", "Mornings", "Afternoons", "Evenings", "August 8, 2026 event day", "Post-event week"].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </label>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-cream/50">No registrations in this view.</p>
            ) : (
              filtered.map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => setSelectedId(reg.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    selectedId === reg.id ? "border-gold/50 bg-gold/10" : "border-white/10 bg-black/20 hover:border-gold/25"
                  }`}
                >
                  <p className="text-sm font-semibold text-cream">{reg.fullName}</p>
                  <p className="text-xs text-cream/55">{reg.volunteerCategories.join(", ")}</p>
                  <p className="mt-1 text-xs text-gold">{reg.status}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {selected && draft ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-ink-deep/70 p-6">
              <h2 className="font-display text-xl text-cream">{selected.fullName}</h2>
              <p className="mt-1 text-sm text-cream/60">Submitted {new Date(selected.submittedAt).toLocaleString()}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-cream/80">
                <p><span className="text-gold/80">Email:</span> {selected.email}</p>
                <p><span className="text-gold/80">Phone:</span> {selected.phone}</p>
                <p><span className="text-gold/80">Birthday:</span> {selected.birthday}</p>
                <p className="sm:col-span-2"><span className="text-gold/80">Categories:</span> {selected.volunteerCategories.join(", ")}</p>
                <p className="sm:col-span-2"><span className="text-gold/80">Availability:</span> {selected.availabilityWindows.join(", ")}</p>
                {selected.relevantSkills && <p className="sm:col-span-2"><span className="text-gold/80">Skills:</span> {selected.relevantSkills}</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-ink-deep/70 p-6">
              <h3 className="font-display text-lg text-cream">Assignment &amp; status</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["Checked In", "Completed", "No Show"] as VolunteerStatus[]).map((status) => (
                  <button key={status} type="button" onClick={() => quickStatus(status)} className="rounded-full border border-white/15 px-3 py-1 text-xs text-cream/80 hover:border-gold/40">
                    Mark {status}
                  </button>
                ))}
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Status</span>
                  <select className={fieldClass} value={draft.status} onChange={(e) => updateDraft("status", e.target.value as VolunteerStatus)}>
                    {volunteerStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Orientation</span>
                  <select className={fieldClass} value={draft.orientationStatus} onChange={(e) => updateDraft("orientationStatus", e.target.value)}>
                    {orientationStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Assigned role</span>
                  <select className={fieldClass} value={draft.assignedRole} onChange={(e) => updateDraft("assignedRole", e.target.value)}>
                    <option value="">Select</option>
                    {volunteerRoleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Assigned category</span>
                  <select className={fieldClass} value={draft.assignedCategory} onChange={(e) => updateDraft("assignedCategory", e.target.value)}>
                    <option value="">Select</option>
                    {assignedCategoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block"><span className={labelClass}>Shift date</span><input className={fieldClass} value={draft.shiftDate} onChange={(e) => updateDraft("shiftDate", e.target.value)} /></label>
                <label className="block"><span className={labelClass}>Shift time</span><input className={fieldClass} value={draft.shiftTime} onChange={(e) => updateDraft("shiftTime", e.target.value)} /></label>
                <label className="block"><span className={labelClass}>Report time</span><input className={fieldClass} value={draft.reportTime} onChange={(e) => updateDraft("reportTime", e.target.value)} /></label>
                <label className="block"><span className={labelClass}>Confirmed arrival</span><input className={fieldClass} value={draft.confirmedArrivalTime} onChange={(e) => updateDraft("confirmedArrivalTime", e.target.value)} /></label>
                <label className="block sm:col-span-2"><span className={labelClass}>Report location</span><input className={fieldClass} value={draft.reportLocation} onChange={(e) => updateDraft("reportLocation", e.target.value)} /></label>
                <label className="block sm:col-span-2"><span className={labelClass}>Supervisor</span><input className={fieldClass} value={draft.supervisorName} onChange={(e) => updateDraft("supervisorName", e.target.value)} /></label>
                <label className="block sm:col-span-2"><span className={labelClass}>Internal notes</span><textarea className={textareaClass} value={draft.internalNotes} onChange={(e) => updateDraft("internalNotes", e.target.value)} /></label>
                <label className="block sm:col-span-2"><span className={labelClass}>Dress code</span><textarea className={textareaClass} value={draft.dressCode} onChange={(e) => updateDraft("dressCode", e.target.value)} /></label>
                <label className="block sm:col-span-2"><span className={labelClass}>Parking / check-in</span><textarea className={textareaClass} value={draft.parkingCheckInInstructions} onChange={(e) => updateDraft("parkingCheckInInstructions", e.target.value)} /></label>
                <label className="block sm:col-span-2"><span className={labelClass}>Conduct expectations</span><textarea className={textareaClass} value={draft.conductExpectations} onChange={(e) => updateDraft("conductExpectations", e.target.value)} /></label>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" disabled={loading} onClick={() => void saveRegistration(false)} className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-cream hover:border-gold/60 disabled:opacity-60">Save changes</button>
                <button type="button" disabled={loading} onClick={() => void saveRegistration(true)} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-black disabled:opacity-60">Save &amp; send status email</button>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-ink-deep/70 p-6">
              <h3 className="font-display text-lg text-cream">Post-event tracking</h3>
              <div className="mt-4 grid gap-4">
                <label className="flex items-center gap-3"><input type="checkbox" checked={draft.completedShift} onChange={(e) => updateDraft("completedShift", e.target.checked)} /><span className="text-sm text-cream/80">Completed shift</span></label>
                <label className="flex items-center gap-3"><input type="checkbox" checked={draft.thankYouEmailSent} onChange={(e) => updateDraft("thankYouEmailSent", e.target.checked)} /><span className="text-sm text-cream/80">Thank-you email sent</span></label>
                <label className="flex items-center gap-3"><input type="checkbox" checked={draft.eligibleForFutureList} onChange={(e) => updateDraft("eligibleForFutureList", e.target.checked)} /><span className="text-sm text-cream/80">Eligible for future volunteer list</span></label>
                <label className="block"><span className={labelClass}>Volunteer hours completed</span><input className={fieldClass} value={draft.volunteerHoursCompleted} onChange={(e) => updateDraft("volunteerHoursCompleted", e.target.value)} /></label>
                <label className="block"><span className={labelClass}>Supervisor notes</span><textarea className={textareaClass} value={draft.supervisorNotes} onChange={(e) => updateDraft("supervisorNotes", e.target.value)} /></label>
              </div>
            </section>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-ink-deep/70 p-8 text-cream/60">Select a registration to review.</div>
        )}
      </div>
    </div>
  );
}
