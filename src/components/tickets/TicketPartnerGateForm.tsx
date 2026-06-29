"use client";

import Image from "next/image";
import { useState } from "react";
import type { ResolvedTicketPartner } from "@/lib/ticket-partner/resolve";

const fieldClass =
  "mt-2 w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50";

type TicketPartnerGateFormProps = {
  partner: ResolvedTicketPartner;
};

export function TicketPartnerGateForm({ partner }: TicketPartnerGateFormProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ticket-partner/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: partner.slug, buyerName, buyerEmail, buyerPhone }),
      });
      const data = (await res.json()) as { error?: string; redirectUrl?: string };
      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? "Unable to continue to Ticketmaster.");
        return;
      }
      window.location.href = data.redirectUrl;
    } catch {
      setError("Unable to continue to Ticketmaster. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const partnerLabel =
    partner.sourceType === "nominee" ? "nominee" : "ticket partner";

  return (
    <div className="card-glow mx-auto max-w-lg rounded-2xl bg-ink-deep/80 p-8 sm:p-10">
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
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-cream/90">Your name</span>
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
          <span className="text-sm font-medium text-cream/90">Email</span>
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
          <span className="text-sm font-medium text-cream/90">Phone number</span>
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
    </div>
  );
}
