"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicErrorAlert } from "@/components/PublicErrorAlert";

type FormState = "idle" | "loading" | "success" | "error";

export function SponsorDeckForm() {
  const [state, setState] = useState<FormState>("idle");
  const [packagesUrl, setPackagesUrl] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/sponsor-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          company: formData.get("company"),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        if (process.env.NODE_ENV === "development") {
          console.error("Sponsor link API failure:", data);
        }
        setState("error");
        return;
      }

      setPackagesUrl(data.packagesUrl ?? "/sponsors");
      setState("success");
      form.reset();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Sponsor link client error:", error);
      }
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold/10 p-8 text-center">
        <p className="font-display text-2xl text-cream">Check your inbox</p>
        <p className="mt-3 text-sm text-cream/75">
          We emailed you a link to the SETVA sponsor packages page. Look for the
          message with the button{" "}
          <strong className="text-gold">View sponsor packages</strong>.
        </p>
        <Link
          href={packagesUrl ?? "/sponsors"}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink transition hover:bg-gold-light"
        >
          View sponsor packages
        </Link>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setPackagesUrl(null);
          }}
          className="mt-4 block w-full text-sm text-cream/60 underline-offset-2 hover:text-gold hover:underline"
        >
          Send to another email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-glow rounded-2xl bg-ink-deep/60 p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        Sponsor packages
      </p>
      <h3 className="mt-2 font-display text-2xl text-cream">
        Get the sponsor packages link
      </h3>
      <p className="mt-3 text-sm text-cream/70">
        Enter your details and we&apos;ll email you a link to the full sponsor
        packages page — every tier, benefits, and partnership option for SETVA
        2026.
      </p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-cream/80">Name</span>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50"
            placeholder="Your name"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-cream/80">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50"
            placeholder="you@company.com"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-cream/80">
            Company <span className="text-cream/40">(optional)</span>
          </span>
          <input
            type="text"
            name="company"
            autoComplete="organization"
            className="mt-1 w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50"
            placeholder="Organization or business"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={state === "loading"}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {state === "loading" ? "Sending…" : "Email sponsor packages link"}
      </button>

      {state === "error" && <PublicErrorAlert className="mt-3" />}
    </form>
  );
}
