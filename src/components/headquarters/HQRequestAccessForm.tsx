"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { brandLogos, site } from "@/lib/site";

export function HQRequestAccessForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/headquarters/account-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Unable to submit request.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Error. Please contact support.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-12">
      <div className="card-glow w-full max-w-md rounded-2xl border border-gold/20 bg-ink-deep/80 p-8 sm:p-10">
        <Link href="/" className="group mb-8 flex justify-center">
          <Image
            src={brandLogos.onDark}
            alt={site.fullName}
            width={1024}
            height={576}
            className="h-auto w-[160px] object-contain transition group-hover:scale-[1.02]"
            sizes="160px"
            priority
          />
        </Link>
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">
          Headquarters
        </p>
        <h1 className="mt-3 text-center font-display text-2xl text-cream">Request Access</h1>
        <p className="mt-2 text-center text-sm text-cream/50">
          Submit your name and email for SETVA leadership review. Approved team members receive a
          SETVA ID by email.
        </p>

        {success ? (
          <div className="mt-8 rounded-lg border border-gold/30 bg-gold/10 px-4 py-4 text-sm leading-relaxed text-cream/85">
            Request received. SETVA leadership at {site.contact.email} will review your request.
            If approved, your SETVA ID will be emailed to you with a link to enter it and create
            your password.
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none focus:border-gold/50"
                required
              />
              <input
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none focus:border-gold/50"
                required
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none focus:border-gold/50"
              required
            />

            {error ? (
              <p className="rounded-lg border border-ruby/30 bg-ruby/10 px-4 py-3 text-sm text-cream/80">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full border border-gold/40 bg-gold/15 py-3 text-sm font-semibold text-gold transition hover:bg-gold/25 disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Request access"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-cream/45">
          Already have access?{" "}
          <Link href="/headquarters/login" className="text-gold hover:text-gold/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
