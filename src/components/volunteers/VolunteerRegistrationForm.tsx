"use client";

import { PillMultiSelect } from "@/components/sponsor-checkout/PillMultiSelect";
import {
  availabilityWindowOptions,
  eventDayInterestOptions,
  postEventInterestOptions,
  preEventInterestOptions,
  volunteerAgreementText,
  volunteerCategoryOptions,
  volunteerSuccessMessage,
  type VolunteerCategory,
  type VolunteerRegistrationData,
} from "@/lib/volunteers";
import { site } from "@/lib/site";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PublicErrorAlert } from "@/components/PublicErrorAlert";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50";

type FormState = Omit<VolunteerRegistrationData, "agreementAccepted"> & {
  agreementAccepted: boolean;
};

function emptyForm(): FormState {
  return {
    fullName: "",
    phone: "",
    email: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    previousExperience: "",
    relevantSkills: "",
    notes: "",
    birthday: "",
    volunteerCategories: [],
    preEventInterests: [],
    eventDayInterests: [],
    postEventInterests: [],
    availabilityWindows: [],
    agreementAccepted: false,
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

export function VolunteerRegistrationForm() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const showPreEvent = form.volunteerCategories.includes("Pre-Event Volunteer");
  const showEventDay = form.volunteerCategories.includes("Event Day Volunteer");
  const showPostEvent = form.volunteerCategories.includes("Post-Event Volunteer");

  const categoryDescriptions = useMemo(
    () =>
      ({
        "Pre-Event Volunteer": "Help prepare outreach, packets, decor, and logistics before August 8.",
        "Event Day Volunteer": "Serve guests, production, and hospitality on show day — including setup and cleanup.",
        "Post-Event Volunteer": "Support follow-up, recap, and thank-you outreach after the event.",
      }) as Record<VolunteerCategory, string>,
    [],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleCategory(category: VolunteerCategory) {
    setForm((current) => {
      const selected = current.volunteerCategories.includes(category);
      const volunteerCategories = selected
        ? current.volunteerCategories.filter((item) => item !== category)
        : [...current.volunteerCategories, category];
      return { ...current, volunteerCategories };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    setApiError(false);
    setLoading(true);

    try {
      const res = await fetch("/api/volunteers", {
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
          Registration received
        </p>
        <p className="mt-4 text-lg text-cream/90">{volunteerSuccessMessage}</p>
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
        <h3 className="font-display text-xl text-cream">Volunteer categories</h3>
        <p className="mt-2 text-sm text-cream/65">
          Select every phase of {site.event.title} where you would like to serve.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {volunteerCategoryOptions.map((category) => {
            const selected = form.volunteerCategories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`rounded-2xl border px-4 py-5 text-left transition-all duration-200 ${
                  selected
                    ? "border-gold bg-gold/10 shadow-lg shadow-gold/10"
                    : "border-gold/20 bg-black/25 hover:border-gold/45 hover:bg-gold/5"
                }`}
                aria-pressed={selected}
              >
                <p className={`text-sm font-semibold ${selected ? "text-gold" : "text-cream"}`}>
                  {category}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-cream/60">
                  {categoryDescriptions[category]}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <h3 className="font-display text-xl text-cream">Your information</h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Full name">
            <input className={fieldClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} autoComplete="name" />
          </Field>
          <Field label="Phone number">
            <input className={fieldClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" />
          </Field>
          <Field label="Email address">
            <input type="email" className={fieldClass} value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Birthday">
            <input
              type="date"
              className={fieldClass}
              value={form.birthday}
              onChange={(e) => update("birthday", e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </Field>
        </div>
      </section>

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <PillMultiSelect
          label="Availability windows"
          description="Select every time window when you can volunteer."
          options={availabilityWindowOptions}
          value={form.availabilityWindows}
          onChange={(value) => update("availabilityWindows", value)}
        />
      </section>

      {showPreEvent && (
        <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
          <PillMultiSelect
            label="Pre-event interest"
            options={preEventInterestOptions}
            value={form.preEventInterests}
            onChange={(value) => update("preEventInterests", value)}
          />
        </section>
      )}

      {showEventDay && (
        <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
          <PillMultiSelect
            label="Event day interest"
            options={eventDayInterestOptions}
            value={form.eventDayInterests}
            onChange={(value) => update("eventDayInterests", value)}
          />
        </section>
      )}

      {showPostEvent && (
        <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
          <PillMultiSelect
            label="Post-event interest"
            options={postEventInterestOptions}
            value={form.postEventInterests}
            onChange={(value) => update("postEventInterests", value)}
          />
        </section>
      )}

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <h3 className="font-display text-xl text-cream">Experience &amp; emergency contact</h3>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Emergency contact name">
            <input className={fieldClass} value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} />
          </Field>
          <Field label="Emergency contact phone number">
            <input className={fieldClass} value={form.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Previous volunteer experience">
            <textarea className={`${fieldClass} min-h-[100px] resize-y`} value={form.previousExperience} onChange={(e) => update("previousExperience", e.target.value)} />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Relevant skills">
            <textarea className={`${fieldClass} min-h-[100px] resize-y`} value={form.relevantSkills} onChange={(e) => update("relevantSkills", e.target.value)} />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Notes or special requests">
            <textarea className={`${fieldClass} min-h-[100px] resize-y`} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <label className="flex items-start gap-3 rounded-xl border border-gold/20 bg-black/30 p-4">
          <input
            type="checkbox"
            checked={form.agreementAccepted}
            onChange={(e) => update("agreementAccepted", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gold/30"
          />
          <span className="text-sm text-cream/85">{volunteerAgreementText}</span>
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
        {loading ? "Submitting…" : "Submit registration"}
      </button>
    </form>
  );
}
