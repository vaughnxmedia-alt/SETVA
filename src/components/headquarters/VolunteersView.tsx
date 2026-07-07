"use client";

import { hqFetch } from "@/lib/headquarters/hq-fetch.client";
import { useState } from "react";
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
import {
  assignedCategoryOptions,
  volunteerRoleOptions,
  volunteerStatusOptions,
} from "@/lib/volunteers";
import type { VolunteerRecord } from "@/lib/headquarters/types";

const FILTER_STATUSES = ["Pending Review", "Approved", "Confirmed", "Checked In", "Completed", "No Show"];

type VolunteerFormState = {
  fullName: string;
  email: string;
  phone: string;
  assignedCategory: string;
  assignedRole: string;
  status: string;
  internalNotes: string;
};

const emptyForm = (): VolunteerFormState => ({
  fullName: "",
  email: "",
  phone: "",
  assignedCategory: "Event Day",
  assignedRole: "",
  status: "Pending Review",
  internalNotes: "",
});

export function VolunteersView({ volunteers: initialVolunteers }: { volunteers: VolunteerRecord[] }) {
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = volunteers.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.role.toLowerCase().includes(q);
    const matchCat = category === "all" || v.category === category;
    const matchStatus = status === "all" || v.status === status;
    return matchSearch && matchCat && matchStatus;
  });

  async function addVolunteer() {
    setBusy(true);
    setError(null);
    try {
      const res = await hqFetch("/api/headquarters/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        volunteer?: VolunteerRecord;
      };
      if (!res.ok || !data.success || !data.volunteer) {
        setError(data.error ?? "Could not add volunteer.");
        return;
      }
      setVolunteers((prev) => [data.volunteer!, ...prev]);
      setMessage(`${data.volunteer.name} added.`);
      setForm(emptyForm());
      setFormOpen(false);
    } catch {
      setError("Could not add volunteer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <HQShell title="Volunteers">
      <p className="mb-6 text-sm text-cream/50">
        Volunteer registrations, roles, and assignments.
      </p>

      {message ? (
        <p className="mb-4 rounded-lg border border-emerald/30 bg-emerald/10 px-4 py-2 text-sm text-emerald-light">
          {message}
        </p>
      ) : null}
      {error && !formOpen ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

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
          {assignedCategoryOptions.map((c) => (
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
          {FILTER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <HQButton onClick={() => { setFormOpen(true); setError(null); }}>
          Add Volunteer
        </HQButton>
      </div>

      {filtered.length === 0 ? (
        <HQEmptyState
          title="No volunteers yet"
          description="Add volunteers manually or they will appear here when they register online."
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
                    <HQBadge tone={v.status === "Confirmed" ? "green" : "default"}>
                      {v.status}
                    </HQBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`${hqPanelClass} w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
            <HQCardHeader
              title="Add Volunteer"
              action={
                <HQButton variant="ghost" onClick={() => setFormOpen(false)} disabled={busy}>
                  Close
                </HQButton>
              }
            />
            <div className="grid gap-4 p-5">
              {error ? (
                <p className="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-2 text-sm text-red-200">
                  {error}
                </p>
              ) : null}
              <label className="block">
                <span className="mb-1 block text-xs text-cream/50">Name *</span>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className={`${hqInputClass} w-full`}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-cream/50">Email *</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={`${hqInputClass} w-full`}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-cream/50">Phone *</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={`${hqInputClass} w-full`}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-cream/50">Category</span>
                <select
                  value={form.assignedCategory}
                  onChange={(e) => setForm((f) => ({ ...f, assignedCategory: e.target.value }))}
                  className={`${hqInputClass} w-full`}
                >
                  {assignedCategoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-cream/50">Role</span>
                <select
                  value={form.assignedRole}
                  onChange={(e) => setForm((f) => ({ ...f, assignedRole: e.target.value }))}
                  className={`${hqInputClass} w-full`}
                >
                  <option value="">Select role (optional)</option>
                  {volunteerRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-cream/50">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className={`${hqInputClass} w-full`}
                >
                  {volunteerStatusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-cream/50">Notes</span>
                <textarea
                  value={form.internalNotes}
                  onChange={(e) => setForm((f) => ({ ...f, internalNotes: e.target.value }))}
                  rows={2}
                  className={`${hqInputClass} w-full`}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-gold/10 px-5 py-4">
              <HQButton variant="outline" onClick={() => setFormOpen(false)} disabled={busy}>
                Cancel
              </HQButton>
              <HQButton
                onClick={addVolunteer}
                disabled={busy || !form.fullName.trim() || !form.email.trim() || !form.phone.trim()}
              >
                Add Volunteer
              </HQButton>
            </div>
          </div>
        </div>
      ) : null}
    </HQShell>
  );
}
