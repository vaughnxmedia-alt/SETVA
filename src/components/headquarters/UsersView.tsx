"use client";

import { useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import {
  HQBadge,
  HQButton,
  HQCardHeader,
  HQEmptyState,
  HQSearchInput,
  hqPanelClass,
  hqTableWrapClass,
} from "@/components/headquarters/ui";
import type { HQUser } from "@/lib/headquarters/auth";

export type HQUserRecord = {
  email: string;
  name: string;
  setvaId: string;
  status: "active" | "revoked";
  createdAt: string;
  updatedAt: string;
};

export function UsersView({
  users: initialUsers,
  currentUser,
}: {
  users: HQUserRecord[];
  currentUser: HQUser;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = users.filter((user) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.setvaId.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || user.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function updateAccess(email: string, status: "active" | "revoked") {
    setBusy(email);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/headquarters/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, status }),
      });
      const data = (await res.json()) as { error?: string; user?: HQUserRecord };
      if (!res.ok || !data.user) {
        setError(data.error ?? "Could not update user.");
        return;
      }
      setUsers((current) =>
        current.map((user) => (user.email === data.user!.email ? data.user! : user)),
      );
      setMessage(
        status === "revoked"
          ? `${data.user.name} no longer has access.`
          : `${data.user.name} access restored.`,
      );
    } catch {
      setError("Could not update user.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <HQShell title="Users" user={currentUser}>
      <div className="space-y-6">
        <HQCardHeader
          title="Team users"
          subtitle="View Headquarters accounts and manage access. All active team members have full admin access."
        />

        <div className={`${hqPanelClass} space-y-4 p-4`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <HQSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name, email, or SETVA ID…"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border border-gold/20 bg-black/40 px-3 py-2 text-sm text-cream"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          {message ? (
            <p className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-cream/85">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-ruby/30 bg-ruby/10 px-4 py-3 text-sm text-cream/85">
              {error}
            </p>
          ) : null}

          {filtered.length === 0 ? (
            <HQEmptyState title="No users found" description="Try a different search or filter." />
          ) : (
            <div className={hqTableWrapClass}>
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gold/15 text-xs uppercase tracking-wider text-cream/45">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">SETVA ID</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const isSelf = user.email.toLowerCase() === currentUser.email.toLowerCase();
                    return (
                      <tr key={user.email} className="border-b border-gold/10 text-cream/85">
                        <td className="px-4 py-3 font-medium text-cream">{user.name}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gold/90">{user.setvaId}</td>
                        <td className="px-4 py-3">
                          <HQBadge tone={user.status === "active" ? "green" : "red"}>
                            {user.status === "active" ? "Active" : "Revoked"}
                          </HQBadge>
                        </td>
                        <td className="px-4 py-3 text-cream/55">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {isSelf ? (
                            <span className="text-xs text-cream/40">You</span>
                          ) : user.status === "active" ? (
                            <HQButton
                              variant="ghost"
                              disabled={busy === user.email}
                              onClick={() => void updateAccess(user.email, "revoked")}
                            >
                              Revoke access
                            </HQButton>
                          ) : (
                            <HQButton
                              variant="ghost"
                              disabled={busy === user.email}
                              onClick={() => void updateAccess(user.email, "active")}
                            >
                              Restore access
                            </HQButton>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </HQShell>
  );
}
