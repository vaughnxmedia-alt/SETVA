"use client";

import { useEffect, useState } from "react";
import { PublicErrorAlert } from "@/components/PublicErrorAlert";
import {
  mediaCredentialTeamMemberSuccessMessage,
  mediaCredentialTeamMemberWarning,
} from "@/lib/media-credential-team";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50";

type Context = {
  applicationId: string;
  mediaOutlet: string;
  applicantName: string;
  teamMemberRoster: { name: string }[];
};

type MediaCredentialTeamMemberFormProps = {
  applicationId: string;
  accessToken: string;
};

export function MediaCredentialTeamMemberForm({
  applicationId,
  accessToken,
}: MediaCredentialTeamMemberFormProps) {
  const [context, setContext] = useState<Context | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
  });

  useEffect(() => {
    const params = new URLSearchParams({
      application: applicationId,
      access: accessToken,
    });

    async function loadContext() {
      setLoadingContext(true);
      setContextError(null);
      try {
        const res = await fetch(`/api/media-credentials/team?${params.toString()}`);
        const data = (await res.json()) as Context & { success?: boolean; error?: string };
        if (!res.ok || !data.success) {
          setContextError(data.error ?? "Could not load registration form.");
          return;
        }
        setContext(data);
      } catch {
        setContextError("Could not load registration form.");
      } finally {
        setLoadingContext(false);
      }
    }

    void loadContext();
  }, [applicationId, accessToken]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(false);

    const params = new URLSearchParams({
      application: applicationId,
      access: accessToken,
    });

    try {
      const res = await fetch(`/api/media-credentials/team?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { success?: boolean };
      if (!res.ok || !data.success) {
        setSubmitError(true);
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingContext) {
    return <p className="text-sm text-cream/60">Loading registration form…</p>;
  }

  if (contextError) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-6 text-sm text-red-100">
        {contextError}
      </div>
    );
  }

  if (!context) return null;

  if (submitted) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold/10 p-8 text-center">
        <p className="font-display text-2xl text-cream">Registration received</p>
        <p className="mt-3 text-sm text-cream/75">{mediaCredentialTeamMemberSuccessMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
        <p className="font-semibold text-amber-50">Required for event entry</p>
        <p className="mt-2">{mediaCredentialTeamMemberWarning}</p>
      </div>

      <div className="rounded-2xl border border-gold/20 bg-ink-deep/60 p-6">
        <p className="text-sm text-cream/70">
          Registering as a team member for{" "}
          <strong className="text-cream">{context.mediaOutlet}</strong> (primary contact:{" "}
          {context.applicantName}).
        </p>
        {context.teamMemberRoster.length > 0 ? (
          <p className="mt-3 text-xs text-cream/50">
            Named on the application: {context.teamMemberRoster.map((member) => member.name).join(", ")}
          </p>
        ) : null}
      </div>

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <h3 className="font-display text-xl text-cream">Your information</h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-cream/90">Full name</span>
            <input
              className={fieldClass}
              required
              value={form.fullName}
              onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-cream/90">Email</span>
            <input
              type="email"
              className={fieldClass}
              required
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-cream/90">Phone</span>
            <input
              className={fieldClass}
              required
              value={form.phone}
              onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-cream/90">Street address</span>
            <input
              className={fieldClass}
              required
              value={form.addressLine1}
              onChange={(e) => setForm((current) => ({ ...current, addressLine1: e.target.value }))}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-cream/90">
              Address line 2 <span className="text-cream/40">(optional)</span>
            </span>
            <input
              className={fieldClass}
              value={form.addressLine2}
              onChange={(e) => setForm((current) => ({ ...current, addressLine2: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-cream/90">City</span>
            <input
              className={fieldClass}
              required
              value={form.city}
              onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-cream/90">State</span>
            <input
              className={fieldClass}
              required
              value={form.state}
              onChange={(e) => setForm((current) => ({ ...current, state: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-cream/90">ZIP code</span>
            <input
              className={fieldClass}
              required
              value={form.zip}
              onChange={(e) => setForm((current) => ({ ...current, zip: e.target.value }))}
            />
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Submitting…" : "Submit team member registration"}
      </button>

      {submitError ? <PublicErrorAlert /> : null}
    </form>
  );
}
