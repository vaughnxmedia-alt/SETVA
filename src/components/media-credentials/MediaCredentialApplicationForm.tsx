"use client";

import Link from "next/link";
import { useState } from "react";
import { PillMultiSelect } from "@/components/sponsor-checkout/PillMultiSelect";
import { PublicErrorAlert } from "@/components/PublicErrorAlert";
import {
  coverageTypeOptions,
  mediaCredentialRules,
  mediaCredentialSuccessMessage,
  type CoverageType,
  type MediaCredentialApplicationData,
} from "@/lib/media-credentials";
import { montCityNetwork, site } from "@/lib/site";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50";

type FormState = Omit<MediaCredentialApplicationData, "rulesAgreed"> & {
  rulesAgreed: boolean;
};

function emptyForm(): FormState {
  return {
    fullName: "",
    phone: "",
    email: "",
    cityState: "",
    mediaOutlet: "",
    website: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    facebook: "",
    totalFollowers: "",
    averageReach: "",
    teamMembers: "",
    equipment: "",
    portfolioLink: "",
    previousCoverageLink: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    additionalComments: "",
    coverageTypes: [],
    rulesAgreed: false,
  };
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-cream/90">{label}</span>
      {hint && <span className="mt-1 block text-xs text-cream/50">{hint}</span>}
      {children}
    </label>
  );
}

export function MediaCredentialApplicationForm() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate(): string | null {
    if (!form.fullName.trim()) return "Full name is required";
    if (!form.phone.trim()) return "Phone number is required";
    if (!form.email.trim()) return "Email address is required";
    if (!form.cityState.trim()) return "City and state are required";
    if (!form.mediaOutlet.trim()) return "Media outlet or creator name is required";
    if (!form.teamMembers.trim()) return "Number of team members attending is required";
    if (!form.equipment.trim()) return "Equipment being brought is required";
    if (!form.emergencyContactName.trim()) return "Emergency contact name is required";
    if (!form.emergencyContactPhone.trim()) {
      return "Emergency contact phone number is required";
    }
    if (form.coverageTypes.length === 0) return "Select at least one coverage type";
    if (!form.rulesAgreed) {
      return "You must agree to the SETVA Media Credential Rules and Regulations";
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    setApiError(false);

    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/media-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setApiError(true);
        return;
      }
      setSubmitted(true);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="card-glow rounded-2xl bg-ink-deep/70 p-8 text-center sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Application received
        </p>
        <p className="mt-4 text-lg text-cream/90">{mediaCredentialSuccessMessage}</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-ruby px-6 py-3 text-sm font-semibold text-white transition hover:bg-ruby-light"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Step 1
        </p>
        <h3 className="mt-2 font-display text-2xl text-cream">
          Media credential application
        </h3>
        <p className="mt-2 text-sm text-cream/65">
          Standard media credentials are for red carpet coverage. Tell us about your
          outlet, audience, and coverage plan — our team reviews every request and
          will specify if lobby or other access is approved.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="Full name">
            <input
              className={fieldClass}
              value={form.fullName}
              onChange={(event) => update("fullName", event.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field label="Phone number">
            <input
              className={fieldClass}
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              autoComplete="tel"
            />
          </Field>
          <Field label="Email address">
            <input
              type="email"
              className={fieldClass}
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="City and state">
            <input
              className={fieldClass}
              value={form.cityState}
              onChange={(event) => update("cityState", event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <h3 className="font-display text-xl text-cream">Outlet &amp; audience</h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Media outlet or creator name">
            <input
              className={fieldClass}
              value={form.mediaOutlet}
              onChange={(event) => update("mediaOutlet", event.target.value)}
            />
          </Field>
          <Field label="Website">
            <input
              className={fieldClass}
              value={form.website}
              onChange={(event) => update("website", event.target.value)}
              placeholder="https://"
            />
          </Field>
          <Field label="Instagram handle">
            <input
              className={fieldClass}
              value={form.instagram}
              onChange={(event) => update("instagram", event.target.value)}
              placeholder="@username"
            />
          </Field>
          <Field label="TikTok handle">
            <input
              className={fieldClass}
              value={form.tiktok}
              onChange={(event) => update("tiktok", event.target.value)}
              placeholder="@username"
            />
          </Field>
          <Field label="YouTube channel">
            <input
              className={fieldClass}
              value={form.youtube}
              onChange={(event) => update("youtube", event.target.value)}
            />
          </Field>
          <Field label="Facebook page">
            <input
              className={fieldClass}
              value={form.facebook}
              onChange={(event) => update("facebook", event.target.value)}
            />
          </Field>
          <Field label="Total followers / subscribers">
            <input
              className={fieldClass}
              value={form.totalFollowers}
              onChange={(event) => update("totalFollowers", event.target.value)}
            />
          </Field>
          <Field label="Average views or reach">
            <input
              className={fieldClass}
              value={form.averageReach}
              onChange={(event) => update("averageReach", event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <PillMultiSelect
          label="Coverage type"
          description="Select every format you plan to produce. Red carpet is standard for media outlets; lobby photography and video are by select approval only."
          options={coverageTypeOptions}
          value={form.coverageTypes}
          onChange={(value) => update("coverageTypes", value as CoverageType[])}
        />
      </section>

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <h3 className="font-display text-xl text-cream">Team &amp; equipment</h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Number of team members attending">
            <input
              className={fieldClass}
              value={form.teamMembers}
              onChange={(event) => update("teamMembers", event.target.value)}
            />
          </Field>
          <Field label="Portfolio or previous work link">
            <input
              className={fieldClass}
              value={form.portfolioLink}
              onChange={(event) => update("portfolioLink", event.target.value)}
              placeholder="https://"
            />
          </Field>
        </div>
        <div className="mt-5">
          <Field
            label="Equipment being brought"
            hint={`List all cameras and gear. Personal cameras are not permitted inside the house during the show—only the ${montCityNetwork.name} production crew may operate in the auditorium.`}
          >
            <textarea
              className={`${fieldClass} min-h-[120px] resize-y`}
              value={form.equipment}
              onChange={(event) => update("equipment", event.target.value)}
            />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Previous event coverage link">
            <input
              className={fieldClass}
              value={form.previousCoverageLink}
              onChange={(event) => update("previousCoverageLink", event.target.value)}
              placeholder="https://"
            />
          </Field>
        </div>
      </section>

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <h3 className="font-display text-xl text-cream">Emergency contact</h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Emergency contact name">
            <input
              className={fieldClass}
              value={form.emergencyContactName}
              onChange={(event) => update("emergencyContactName", event.target.value)}
            />
          </Field>
          <Field label="Emergency contact phone number">
            <input
              className={fieldClass}
              value={form.emergencyContactPhone}
              onChange={(event) => update("emergencyContactPhone", event.target.value)}
            />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Additional comments">
            <textarea
              className={`${fieldClass} min-h-[120px] resize-y`}
              value={form.additionalComments}
              onChange={(event) => update("additionalComments", event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <h3 className="font-display text-xl text-cream">
          SETVA Media Credential Rules and Regulations
        </h3>
        <ul className="mt-4 space-y-3 text-sm text-cream/75">
          {mediaCredentialRules.map((rule) => (
            <li key={rule} className="flex gap-3">
              <span className="text-gold">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
        <label className="mt-6 flex items-start gap-3 rounded-xl border border-gold/20 bg-black/30 p-4">
          <input
            type="checkbox"
            checked={form.rulesAgreed}
            onChange={(event) => update("rulesAgreed", event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gold/30"
          />
          <span className="text-sm text-cream/85">
            I have read and agree to the SETVA Media Credential Rules and Regulations.
          </span>
        </label>
      </section>

      {validationError && (
        <p className="rounded-xl border border-ruby/30 bg-ruby/10 px-4 py-3 text-sm text-cream">
          {validationError}
        </p>
      )}
      {apiError && <PublicErrorAlert />}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ruby px-8 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-ruby-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
