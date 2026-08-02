"use client";

import Image from "next/image";
import { useState } from "react";
import {
  externalBrowserUrl,
  inAppBrowserName,
  openInBrowserHint,
} from "@/lib/in-app-browser";
import type { ResolvedTicketPartner } from "@/lib/ticket-partner/resolve";
import { useUserAgent } from "@/lib/use-user-agent";

const fieldClass =
  "mt-2 w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50";

const ticketButtonClass =
  "block w-full rounded-full bg-ruby px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-ruby-light";

type TicketPartnerGateFormProps = {
  /** Null when the link cannot be matched to a nominee or ambassador. */
  partner: ResolvedTicketPartner | null;
  slug: string;
  ticketmasterUrl: string;
  /** Absolute URL of this page, used to reopen it outside an embedded browser. */
  gateUrl: string;
};

export function TicketPartnerGateForm({
  partner,
  slug,
  ticketmasterUrl,
  gateUrl,
}: TicketPartnerGateFormProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [destination, setDestination] = useState("");
  const [copied, setCopied] = useState(false);

  const userAgent = useUserAgent();
  const embeddedApp = inAppBrowserName(userAgent);
  const hint = embeddedApp ? openInBrowserHint(userAgent, embeddedApp) : "";
  // Before the form is submitted the escape reopens this page, so the buyer is
  // still recorded; afterwards it goes straight to checkout.
  const escapeUrl = embeddedApp
    ? externalBrowserUrl(destination || gateUrl, userAgent)
    : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!buyerName.trim() || !buyerPhone.trim() || !emailPattern.test(buyerEmail.trim())) {
      setError("Your name, a valid email, and phone number are all required.");
      return;
    }

    setLoading(true);

    let redirectUrl = ticketmasterUrl;
    try {
      const res = await fetch("/api/ticket-partner/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, buyerName, buyerEmail, buyerPhone }),
      });
      const data = (await res.json()) as { redirectUrl?: string };
      if (data.redirectUrl) redirectUrl = data.redirectUrl;
    } catch {
      // Recording the lead is best-effort; the buyer still goes to Ticketmaster.
    } finally {
      setLoading(false);
    }

    setDestination(redirectUrl);

    // The buyer is recorded, so send them on. Embedded social browsers hit
    // Ticketmaster's bot check, so those hand off to a real browser instead.
    const target = embeddedApp
      ? externalBrowserUrl(redirectUrl, userAgent) ?? redirectUrl
      : redirectUrl;

    // Let the fallback buttons paint first, in case the hand-off is refused.
    window.setTimeout(() => {
      window.location.href = target;
    }, embeddedApp ? 500 : 0);
  }

  async function copyLink() {
    try {
      await window.navigator.clipboard.writeText(destination || ticketmasterUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  const partnerLabel = partner?.sourceType === "nominee" ? "nominee" : "ticket partner";

  return (
    <div
      id="ticket-form"
      className="card-glow mx-auto max-w-lg scroll-mt-24 rounded-2xl bg-ink-deep/80 p-8 sm:p-10"
    >
      <div className="text-center">
        <Image
          src="/setva-logo-gold.png"
          alt="SETVA"
          width={120}
          height={48}
          className="mx-auto h-12 w-auto"
        />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Ticket partner link
        </p>
        <h1 className="mt-3 font-display text-2xl text-cream">Continue to Ticketmaster</h1>
        {partner ? (
          <p className="mt-3 text-sm text-cream/70">
            You&apos;re supporting <strong className="text-gold">{partner.sourceName}</strong>
            {partner.category ? (
              <>
                {" "}
                <span className="text-cream/50">({partner.category})</span>
              </>
            ) : null}
            .
          </p>
        ) : (
          <p className="mt-3 text-sm text-cream/70">
            Get your tickets to the Southeast Texas Visionary Awards.
          </p>
        )}
      </div>

      {embeddedApp && !destination ? (
        <div className="mt-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
          <p className="text-sm font-semibold text-gold">Fill this out, then we&apos;ll open Ticketmaster</p>
          <p className="mt-1 text-xs text-cream/75">{hint}</p>
        </div>
      ) : null}

      {destination ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-cream/80">
            {embeddedApp
              ? `You're all set. ${hint}`
              : "Taking you to Ticketmaster. If nothing happens, use the button below."}
          </p>
          {embeddedApp && escapeUrl ? (
            <a href={escapeUrl} className={ticketButtonClass}>
              Open Ticketmaster in your browser
            </a>
          ) : null}
          <a
            href={destination}
            target="_blank"
            rel="noopener noreferrer"
            className={
              embeddedApp && escapeUrl
                ? "block w-full rounded-full border border-gold/30 px-6 py-3 text-center text-sm font-semibold text-gold transition hover:bg-gold/10"
                : ticketButtonClass
            }
          >
            Open Ticketmaster
          </a>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="w-full rounded-full border border-gold/30 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold/10"
          >
            {copied ? "Link copied" : "Copy ticket link"}
          </button>
          <p className="break-all text-center text-[11px] text-cream/40">{destination}</p>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-cream/90">
              Your name <span className="text-ruby">*</span>
            </span>
            <input
              type="text"
              autoComplete="name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className={fieldClass}
              placeholder="First and last name"
              required
              maxLength={120}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-cream/90">
              Email <span className="text-ruby">*</span>
            </span>
            <input
              type="email"
              autoComplete="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              className={fieldClass}
              placeholder="you@example.com"
              required
              maxLength={254}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-cream/90">
              Phone number <span className="text-ruby">*</span>
            </span>
            <input
              type="tel"
              autoComplete="tel"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className={fieldClass}
              placeholder="(409) 555-1234"
              required
              maxLength={40}
            />
          </label>

          <p className="text-xs text-cream/40">All fields are required.</p>

          <p className="text-xs text-cream/50">
            We use this information to connect your ticket interest to this {partnerLabel} when
            Ticketmaster data becomes available. This does not guarantee commission.
          </p>

          {error ? (
            <p className="rounded-xl border border-ruby/30 bg-ruby/10 px-4 py-3 text-sm text-cream/85">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ruby px-6 py-3 text-sm font-semibold text-white transition hover:bg-ruby-light disabled:opacity-60"
          >
            {loading ? "Opening Ticketmaster…" : "Continue to Ticketmaster"}
          </button>
        </form>
      )}
    </div>
  );
}
