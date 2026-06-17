"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PillMultiSelect } from "@/components/sponsor-checkout/PillMultiSelect";
import { MontCityNetworkBadge } from "@/components/MontCityNetworkBadge";
import { PublicErrorAlert } from "@/components/PublicErrorAlert";
import { SponsorPackageVisual } from "@/components/SponsorPackageVisual";
import {
  activationInterests,
  availableAssets,
  availableSponsorPackages,
  getSponsorPackage,
  PAY_BY_CHECK_OR_MONEY_ORDER,
  PAY_BY_CHECK_OR_MONEY_ORDER_MEETING,
  paymentUsesSquare,
  preferredPaymentOptions,
  sponsorIndustries,
  sponsorshipGoals,
  type SponsorIntakeData,
} from "@/lib/sponsor-intake";
import { isPackageSoldOut } from "@/lib/sponsor-inventory";
import { montCityNetwork, site } from "@/lib/site";

const STEPS = [
  "Package",
  "Company",
  "Goals",
  "Agreements",
  "Review",
] as const;

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50";

const selectClass =
  "mt-1 w-full appearance-none rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50";

const INTAKE_STORAGE_KEY = "setva-sponsor-intake-token";

type FormState = Omit<
  SponsorIntakeData,
  "authorized" | "exclusivityAcknowledged" | "availabilityAcknowledged"
> & {
  authorized: boolean;
  exclusivityAcknowledged: boolean;
  availabilityAcknowledged: boolean;
};

const defaultPackageId =
  availableSponsorPackages().find((pkg) => pkg.highlighted)?.id ??
  availableSponsorPackages()[0]?.id ??
  "";

function emptyForm(packageId: string): FormState {
  return {
    packageId,
    companyName: "",
    contactName: "",
    jobTitle: "",
    email: "",
    phone: "",
    website: "",
    companyDescription: "",
    socialMedia: "",
    industry: "",
    preferredPayment: "",
    meetingNotes: "",
    primaryGoals: [],
    activationInterests: [],
    availableAssets: [],
    authorized: false,
    exclusivityAcknowledged: false,
    availabilityAcknowledged: false,
  };
}

export function SponsorCheckoutFlow() {
  const searchParams = useSearchParams();
  const initialPackage = (() => {
    const requested = searchParams.get("package");
    if (requested) {
      const pkg = getSponsorPackage(requested);
      if (pkg && !isPackageSoldOut(pkg)) return requested;
    }
    return defaultPackageId;
  })();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => emptyForm(initialPackage));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedPackage = useMemo(
    () => getSponsorPackage(form.packageId),
    [form.packageId],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateStep(currentStep: number): string | null {
    if (currentStep === 0) {
      if (!selectedPackage || selectedPackage.contactOnly) {
        return "Select a sponsorship package";
      }
      if (isPackageSoldOut(selectedPackage)) {
        return `${selectedPackage.name} is sold out. Choose another package or contact us to join the waitlist.`;
      }
    }

    if (currentStep === 1) {
      if (!form.companyName.trim()) return "Company name is required";
      if (!form.contactName.trim()) return "Contact name is required";
      if (!form.jobTitle.trim()) return "Job title is required";
      if (!form.email.trim()) return "Email is required";
      if (!form.phone.trim()) return "Phone number is required";
      if (!form.companyDescription.trim()) {
        return "Brief company description is required";
      }
    }

    if (currentStep === 2) {
      if (!form.industry) return "Select an industry";
      if (!form.preferredPayment) return "Select a payment preference";
      if (
        form.preferredPayment === PAY_BY_CHECK_OR_MONEY_ORDER_MEETING &&
        !form.meetingNotes.trim()
      ) {
        return "Share your preferred meeting days and times for check or money order pickup";
      }
      if (form.primaryGoals.length === 0) {
        return "Select at least one primary sponsorship goal";
      }
      if (form.activationInterests.length === 0) {
        return "Select at least one activation interest";
      }
      if (form.availableAssets.length === 0) {
        return "Select at least one available asset";
      }
    }

    if (currentStep === 3) {
      if (!form.authorized || !form.exclusivityAcknowledged || !form.availabilityAcknowledged) {
        return "All required agreements must be accepted";
      }
    }

    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setValidationError(message);
      setApiError(false);
      return;
    }
    setValidationError(null);
    setApiError(false);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goBack() {
    setValidationError(null);
    setApiError(false);
    setStep((current) => Math.max(current - 1, 0));
  }

  function submitLabel(): string {
    if (!selectedPackage) return "Submit";
    const amount = `$${selectedPackage.price.toLocaleString()}`;
    switch (form.preferredPayment) {
      case "Pay electronically (Square)":
        return `Proceed to payment — ${amount}`;
      case PAY_BY_CHECK_OR_MONEY_ORDER:
        return `Submit & get payment instructions — ${amount}`;
      case PAY_BY_CHECK_OR_MONEY_ORDER_MEETING:
        return `Submit & schedule payment pickup — ${amount}`;
      default:
        return "Submit sponsorship request";
    }
  }

  async function proceedToPayment() {
    const message = validateStep(3);
    if (message) {
      setValidationError(message);
      setApiError(false);
      setStep(3);
      return;
    }

    setLoading(true);
    setValidationError(null);
    setApiError(false);

    try {
      const res = await fetch("/api/sponsor-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        if (process.env.NODE_ENV === "development") {
          console.error("Sponsor checkout API failure:", data);
        }
        setApiError(true);
        setLoading(false);
        return;
      }

      if (data.intakeToken) {
        sessionStorage.setItem(INTAKE_STORAGE_KEY, data.intakeToken);
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.error("Sponsor checkout missing redirect URL:", data);
      }
      setApiError(true);
      setLoading(false);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Sponsor checkout client error:", error);
      }
      setApiError(true);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Sponsorship checkout
        </p>
        <h1 className="mt-2 font-display text-3xl text-cream sm:text-4xl">
          Partner with SETVA 2026
        </h1>
        <p className="mt-3 text-sm text-cream/70">
          Complete your sponsor profile, review your package, then proceed to secure
          Square checkout. Asset uploads and activation details come after payment in
          the sponsor portal.
        </p>
      </div>

      <ol className="mb-8 grid grid-cols-5 gap-2">
        {STEPS.map((label, index) => {
          const active = index === step;
          const complete = index < step;
          return (
            <li
              key={label}
              className={`rounded-xl border px-2 py-3 text-center text-xs font-semibold transition sm:text-sm ${
                active
                  ? "border-gold bg-gold/15 text-gold"
                  : complete
                    ? "border-gold/30 bg-black/40 text-cream/80"
                    : "border-gold/10 bg-black/20 text-cream/45"
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wider opacity-70">
                Step {index + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      <div className="card-glow rounded-2xl bg-ink-deep/60 p-6 sm:p-8">
        {step === 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-2xl text-cream">Select your package</h2>
              <p className="mt-2 text-sm text-cream/65">
                Choose the sponsorship level that fits your organization.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-cream/80">
                Sponsorship level
              </span>
              <select
                value={form.packageId}
                onChange={(e) => update("packageId", e.target.value)}
                className={selectClass}
              >
                {availableSponsorPackages().map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} — ${pkg.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </label>

            {selectedPackage && (
              <div className="space-y-4">
                <SponsorPackageVisual pkg={selectedPackage} />
                <div className="rounded-2xl border border-gold/20 bg-black/35 p-5">
                  <p className="text-sm font-semibold uppercase tracking-wider text-gold">
                    Package summary
                  </p>
                  <h3 className="mt-2 font-display text-xl text-cream">
                    {selectedPackage.name}
                  </h3>
                  <p className="mt-1 text-2xl font-semibold text-gold">
                    ${selectedPackage.price.toLocaleString()}
                  </p>
                  <p className="mt-3 text-sm text-cream/70">
                    {selectedPackage.description}
                  </p>
                  {selectedPackage.montCityMedia && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                      <p className="text-xs text-cream/55">
                        Includes {montCityNetwork.name} broadcast & production
                        benefits
                      </p>
                      <MontCityNetworkBadge compact />
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-2xl text-cream">Company & contact</h2>
              <p className="mt-2 text-sm text-cream/65">
                Tell us who is leading this partnership.
              </p>
            </div>

            {[
              ["companyName", "Company name", "Organization or business name"],
              ["contactName", "Contact name", "Primary point of contact"],
              ["jobTitle", "Job title", "Your role"],
              ["email", "Email address", "you@company.com", "email"],
              ["phone", "Phone number", "318-555-0100", "tel"],
              ["website", "Website", "https://company.com (optional)"],
            ].map(([key, label, placeholder, type = "text"]) => (
              <label key={key} className="block">
                <span className="text-sm font-medium text-cream/80">{label}</span>
                <input
                  type={type}
                  value={form[key as keyof FormState] as string}
                  onChange={(e) =>
                    update(key as keyof FormState, e.target.value as never)
                  }
                  placeholder={placeholder}
                  className={fieldClass}
                  required={key !== "website"}
                />
              </label>
            ))}

            <label className="block">
              <span className="text-sm font-medium text-cream/80">
                Brief company description
              </span>
              <textarea
                value={form.companyDescription}
                onChange={(e) => update("companyDescription", e.target.value)}
                rows={4}
                placeholder="What does your organization do, and why SETVA?"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-cream/80">
                Social media handles
              </span>
              <input
                type="text"
                value={form.socialMedia}
                onChange={(e) => update("socialMedia", e.target.value)}
                placeholder="@brand · Instagram / Facebook / LinkedIn"
                className={fieldClass}
              />
            </label>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-2xl text-cream">Partnership goals</h2>
              <p className="mt-2 text-sm text-cream/65">
                Help us understand how you want to show up at SETVA 2026.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-cream/80">Industry</span>
              <select
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                className={selectClass}
              >
                <option value="">Select industry</option>
                {sponsorIndustries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-cream/80">
                Payment method
              </span>
              <select
                value={form.preferredPayment}
                onChange={(e) => update("preferredPayment", e.target.value)}
                className={selectClass}
              >
                <option value="">Select payment method</option>
                {preferredPaymentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <p className="rounded-xl border border-gold/15 bg-black/30 px-4 py-3 text-xs text-cream/60">
              {site.sponsorPayment.policyNote}
            </p>

            {form.preferredPayment === PAY_BY_CHECK_OR_MONEY_ORDER && (
              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-5 text-sm text-cream/75">
                <p className="font-semibold text-gold">
                  Paying by check or money order
                </p>
                <p className="mt-2">
                  After you submit, we&apos;ll email payment instructions. Mail
                  your check or money order, or schedule an in-person drop-off
                  with our team.
                </p>
                <p className="mt-2 text-cream/55">
                  Make checks and money orders payable to{" "}
                  <strong className="text-cream/80">{site.org}</strong>. Cash is
                  not accepted.
                </p>
              </div>
            )}

            {form.preferredPayment === PAY_BY_CHECK_OR_MONEY_ORDER_MEETING && (
              <label className="block">
                <span className="text-sm font-medium text-cream/80">
                  Preferred meeting times for check or money order pickup
                </span>
                <p className="mt-1 text-xs text-cream/55">
                  Share days and times to hand-deliver your sponsorship check or
                  money order. Cash is not accepted.
                </p>
                <textarea
                  value={form.meetingNotes}
                  onChange={(e) => update("meetingNotes", e.target.value)}
                  rows={4}
                  placeholder="e.g. Tuesdays or Thursdays after 2 PM · Beaumont area · bringing sponsorship check or money order"
                  className={fieldClass}
                />
              </label>
            )}

            {form.preferredPayment === "Pay electronically (Square)" && (
              <div className="rounded-2xl border border-gold/20 bg-black/35 p-5 text-sm text-cream/70">
                <p>
                  You&apos;ll complete payment securely through Square after
                  reviewing your sponsorship details. Card and other electronic
                  payment methods accepted — no cash.
                </p>
              </div>
            )}

            <PillMultiSelect
              label="Primary sponsorship goal"
              description="Select all that apply"
              options={sponsorshipGoals}
              value={form.primaryGoals}
              onChange={(value) => update("primaryGoals", value)}
            />

            <PillMultiSelect
              label="Activation interests"
              options={activationInterests}
              value={form.activationInterests}
              onChange={(value) => update("activationInterests", value)}
            />

            <PillMultiSelect
              label="Available assets"
              description="What you can provide after payment through the sponsor portal"
              options={availableAssets}
              value={form.availableAssets}
              onChange={(value) => update("availableAssets", value)}
            />
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5">
            <div>
              <h2 className="font-display text-2xl text-cream">Agreements</h2>
              <p className="mt-2 text-sm text-cream/65">
                Please confirm the following before proceeding to payment.
              </p>
            </div>

            {[
              {
                key: "authorized" as const,
                label:
                  "I am authorized to enter into sponsorship agreements on behalf of my organization.",
              },
              {
                key: "exclusivityAcknowledged" as const,
                label:
                  "I understand that submission does not guarantee exclusivity unless otherwise agreed upon.",
              },
              {
                key: "availabilityAcknowledged" as const,
                label:
                  "I acknowledge that sponsorship benefits are subject to availability and package level.",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer gap-3 rounded-xl border border-gold/15 bg-black/30 p-4 transition hover:border-gold/35"
              >
                <input
                  type="checkbox"
                  checked={form[item.key]}
                  onChange={(e) => update(item.key, e.target.checked)}
                  className="mt-1 h-4 w-4 accent-gold"
                />
                <span className="text-sm text-cream/80">{item.label}</span>
              </label>
            ))}
          </section>
        )}

        {step === 4 && selectedPackage && (
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-2xl text-cream">
                {paymentUsesSquare(form.preferredPayment)
                  ? "Review & pay"
                  : "Review & submit"}
              </h2>
              <p className="mt-2 text-sm text-cream/65">
                {paymentUsesSquare(form.preferredPayment)
                  ? "Confirm your details, then continue to Square secure checkout."
                  : "Confirm your details and submit your sponsorship request."}
              </p>
            </div>

            <div className="space-y-4 rounded-2xl border border-gold/20 bg-black/35 p-5 text-sm text-cream/80">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Package
                </p>
                <p className="mt-1 text-cream">
                  {selectedPackage.name} — ${selectedPackage.price.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Organization
                </p>
                <p className="mt-1">{form.companyName}</p>
                <p>{form.contactName} · {form.jobTitle}</p>
                <p>{form.email} · {form.phone}</p>
                {form.website && <p>{form.website}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Goals & interests
                </p>
                <p className="mt-1">{form.primaryGoals.join(", ")}</p>
                <p className="mt-2">{form.activationInterests.join(", ")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Payment method
                </p>
                <p className="mt-1">{form.preferredPayment}</p>
                {form.meetingNotes && (
                  <p className="mt-2 text-cream/65">
                    Meeting preference: {form.meetingNotes}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-cream/50">
              {paymentUsesSquare(form.preferredPayment)
                ? "You will be redirected to Square for electronic payment. Cash is not accepted."
                : "Our team will email check or money order payment instructions. Sponsorships are paid through Square, check, or money order — no cash."}
            </p>
          </section>
        )}

        {validationError && (
          <p className="mt-4 text-sm text-red-400">{validationError}</p>
        )}
        {apiError && <PublicErrorAlert className="mt-4" />}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-full border border-gold/40 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold/10"
            >
              Back
            </button>
          ) : (
            <Link
              href="/sponsors"
              className="rounded-full border border-gold/40 px-6 py-3 text-center text-sm font-semibold text-gold transition hover:bg-gold/10"
            >
              Back to packages
            </Link>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink transition hover:bg-gold-light"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={proceedToPayment}
              disabled={loading}
              className="rounded-full bg-ruby px-8 py-3 text-sm font-semibold text-white transition hover:bg-ruby-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting…" : submitLabel()}
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-cream/45">
        Questions before checkout?{" "}
        <a href={`mailto:${site.contact.email}`} className="text-gold hover:underline">
          {site.contact.email}
        </a>
      </p>
    </div>
  );
}

export { INTAKE_STORAGE_KEY };
