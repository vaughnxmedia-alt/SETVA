"use client";

import { PillMultiSelect } from "@/components/sponsor-checkout/PillMultiSelect";
import { PublicErrorAlert } from "@/components/PublicErrorAlert";
import {
  ambassadorAgreementText,
  ambassadorPromotionChannels,
  ambassadorSuccessMessage,
  type AmbassadorPromotionChannel,
  type AmbassadorRegistrationData,
} from "@/lib/ambassadors";
import { site, ticketPartnerInfo } from "@/lib/site";
import Link from "next/link";
import { useState } from "react";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50";

type FormState = Omit<AmbassadorRegistrationData, "agreementAccepted"> & {
  agreementAccepted: boolean;
};

function emptyForm(): FormState {
  return {
    fullName: "",
    phone: "",
    email: "",
    city: "",
    organization: "",
    promotionChannels: [],
    socialHandle: "",
    estimatedReach: "",
    whyJoin: "",
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

export function AmbassadorRegistrationClosed({
  opensLabel,
}: {
  opensLabel: string;
}) {
  return (
    <div className="card-glow rounded-2xl bg-ink-deep/70 p-8 text-center sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        Registration opens soon
      </p>
      <p className="mt-4 text-lg text-cream/90">
        Ambassador registration opens <strong className="text-gold">{opensLabel}</strong>.
      </p>
      <p className="mt-3 text-sm text-cream/60">
        Earn {ticketPartnerInfo.commissionPercent}% on every ticket sold through your custom link.
        Check back then to register, or learn more about the program below.
      </p>
      <Link
        href="/ticket-partners"
        className="mt-8 inline-flex rounded-full border border-gold/50 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold/10"
      >
        About the Ticket Partner program
      </Link>
    </div>
  );
}

export function AmbassadorRegistrationForm() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [apiError, setApiError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(false);
    setLoading(true);

    try {
      const res = await fetch("/api/ambassadors", {
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
        <p className="mt-4 text-lg text-cream/90">{ambassadorSuccessMessage()}</p>
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
        <h3 className="font-display text-xl text-cream">Your information</h3>
        <p className="mt-2 text-sm text-cream/65">
          Register as a SETVA Ticket Partner (Ambassador) for {site.event.title}.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Full name">
            <input
              className={fieldClass}
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              autoComplete="name"
              required
            />
          </Field>
          <Field label="Phone number">
            <input
              className={fieldClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              autoComplete="tel"
              required
            />
          </Field>
          <Field label="Email address">
            <input
              type="email"
              className={fieldClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field label="City">
            <input
              className={fieldClass}
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              autoComplete="address-level2"
              required
            />
          </Field>
          <Field label="Organization" hint="Optional — church, business, or group name">
            <input
              className={fieldClass}
              value={form.organization}
              onChange={(e) => update("organization", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <h3 className="font-display text-xl text-cream">How you&apos;ll promote tickets</h3>
        <div className="mt-6 space-y-6">
          <PillMultiSelect
            label="Promotion channels"
            description="Select all that apply"
            options={ambassadorPromotionChannels}
            value={form.promotionChannels}
            onChange={(channels) =>
              update("promotionChannels", channels as AmbassadorPromotionChannel[])
            }
          />
          <Field label="Social handle or website" hint="Optional">
            <input
              className={fieldClass}
              value={form.socialHandle}
              onChange={(e) => update("socialHandle", e.target.value)}
              placeholder="@username or yoursite.com"
            />
          </Field>
          <Field label="Estimated reach" hint="Optional — e.g. followers, congregation size, network">
            <input
              className={fieldClass}
              value={form.estimatedReach}
              onChange={(e) => update("estimatedReach", e.target.value)}
            />
          </Field>
          <Field label="Why do you want to join?" hint="Optional">
            <textarea
              className={`${fieldClass} min-h-[120px] resize-y`}
              value={form.whyJoin}
              onChange={(e) => update("whyJoin", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card-glow rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={form.agreementAccepted}
            onChange={(e) => update("agreementAccepted", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gold/30 bg-black/40 text-ruby focus:ring-gold/40"
            required
          />
          <span className="text-sm leading-relaxed text-cream/75">{ambassadorAgreementText}</span>
        </label>
      </section>

      {apiError && <PublicErrorAlert />}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ruby px-8 py-4 font-semibold text-white transition hover:bg-ruby-light disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Submitting…" : "Submit ambassador registration"}
      </button>
    </form>
  );
}
