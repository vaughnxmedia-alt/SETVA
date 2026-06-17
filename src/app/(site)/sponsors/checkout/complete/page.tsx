"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { INTAKE_STORAGE_KEY } from "@/components/sponsor-checkout/SponsorCheckoutFlow";
import { PublicErrorAlert } from "@/components/PublicErrorAlert";
import { getSponsorPackage } from "@/lib/sponsor-intake";
import { site } from "@/lib/site";

type CompleteStatus = "loading" | "success" | "check" | "meeting" | "demo" | "error";

export default function SponsorCheckoutCompletePage() {
  const [status, setStatus] = useState<CompleteStatus>("loading");
  const [packageName, setPackageName] = useState<string | null>(null);
  const [packagePrice, setPackagePrice] = useState<number | null>(null);
  const [meetingNotes, setMeetingNotes] = useState<string | null>(null);

  useEffect(() => {
    async function confirm() {
      const params = new URLSearchParams(window.location.search);
      const method = params.get("method");
      const intakeToken = sessionStorage.getItem(INTAKE_STORAGE_KEY);

      if (method === "check") {
        setStatus("check");
        sessionStorage.removeItem(INTAKE_STORAGE_KEY);
        return;
      }

      if (method === "meeting") {
        setStatus("meeting");
        sessionStorage.removeItem(INTAKE_STORAGE_KEY);
        return;
      }

      if (!intakeToken) {
        setStatus("error");
        return;
      }

      try {
        const res = await fetch("/api/sponsor-checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intakeToken,
            demo: params.get("demo") === "1",
          }),
        });
        const data = await res.json();
        if (!res.ok || data.success === false) {
          if (process.env.NODE_ENV === "development") {
            console.error("Sponsor confirmation API failure:", data);
          }
          setStatus("error");
          return;
        }

        const pkg = getSponsorPackage(data.packageId);
        setPackageName(pkg?.name ?? null);
        setPackagePrice(pkg?.price ?? null);
        setMeetingNotes(data.meetingNotes ?? null);
        setStatus(data.demo ? "demo" : "success");
        sessionStorage.removeItem(INTAKE_STORAGE_KEY);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Sponsor confirmation client error:", error);
        }
        setStatus("error");
      }
    }

    void confirm();
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16 sm:px-6">
      <div className="max-w-xl text-center">
        {status === "loading" && (
          <>
            <p className="text-5xl">✨</p>
            <h1 className="mt-4 font-display text-3xl text-cream">
              Confirming your sponsorship…
            </h1>
          </>
        )}

        {status === "success" && (
          <>
            <p className="text-5xl">🎉</p>
            <h1 className="mt-4 font-display text-3xl text-cream sm:text-4xl">
              Sponsorship received
            </h1>
            <p className="mt-4 text-cream/70">
              Thank you for partnering with SETVA 2026
              {packageName ? ` as a ${packageName}` : ""}. A confirmation email
              is on the way with next steps.
            </p>
          </>
        )}

        {status === "check" && (
          <>
            <p className="text-5xl">✉️</p>
            <h1 className="mt-4 font-display text-3xl text-cream sm:text-4xl">
              Payment instructions sent
            </h1>
            <p className="mt-4 text-cream/70">
              We emailed your check or money order payment details. You can also
              use the information below.
            </p>
            <div className="mt-8 rounded-2xl border border-gold/20 bg-ink-deep/60 p-6 text-left text-sm text-cream/80">
              <p>
                <span className="text-gold">Make payable to:</span>{" "}
                {site.sponsorPayment.checkPayableTo}
              </p>
              <p className="mt-3">
                <span className="text-gold">Memo:</span>{" "}
                {site.sponsorPayment.checkMemoHint}
              </p>
              <p className="mt-3">{site.sponsorPayment.checkMailingNote}</p>
              <p className="mt-3 text-cream/55">{site.sponsorPayment.policyNote}</p>
            </div>
          </>
        )}

        {status === "meeting" && (
          <>
            <p className="text-5xl">📅</p>
            <h1 className="mt-4 font-display text-3xl text-cream sm:text-4xl">
              Payment pickup meeting requested
            </h1>
            <p className="mt-4 text-cream/70">
              {site.sponsorPayment.meetingFollowUpNote} A confirmation email with
              your check or money order pickup details has been sent to your inbox.
            </p>
            <p className="mt-6 text-sm text-cream/55">
              Prefer to reach us now?{" "}
              <a href={`mailto:${site.contact.email}`} className="text-gold hover:underline">
                {site.contact.email}
              </a>{" "}
              · {site.contact.phone}
            </p>
          </>
        )}

        {status === "demo" && (
          <>
            <p className="text-5xl">✨</p>
            <h1 className="mt-4 font-display text-3xl text-cream">
              Preview checkout complete
            </h1>
            <p className="mt-4 text-cream/70">
              Demo mode — no payment was processed.
              {packageName ? ` Package: ${packageName}.` : ""}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <p className="text-5xl">!</p>
            <h1 className="mt-4 font-display text-3xl text-cream">
              Something went wrong
            </h1>
            <PublicErrorAlert className="mt-4 text-left" />
          </>
        )}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-gold px-8 py-3 font-semibold text-ink hover:bg-gold-light"
          >
            Back to home
          </Link>
          <Link
            href="/sponsors"
            className="rounded-full border border-gold/50 px-8 py-3 font-semibold text-gold hover:bg-gold/10"
          >
            View sponsor packages
          </Link>
        </div>
      </div>
    </div>
  );
}
