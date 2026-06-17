"use client";

import { useState } from "react";
import { PublicErrorAlert } from "@/components/PublicErrorAlert";
import { sponsorDeck } from "@/lib/sponsor-deck";

type FormState = "idle" | "loading" | "success" | "error";

export function SponsorDeckForm() {
  const [state, setState] = useState<FormState>("idle");
  const [deckViewUrl, setDeckViewUrl] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

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
          console.error("Sponsor deck API failure:", data);
        }
        setState("error");
        return;
      }

      setDeckViewUrl(data.deckViewUrl ?? null);
      setDemoMode(Boolean(data.demo));
      setState("success");
      form.reset();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Sponsor deck client error:", error);
      }
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold/10 p-8 text-center">
        <p className="font-display text-2xl text-cream">Check your inbox</p>
        <p className="mt-3 text-sm text-cream/75">
          We sent the <strong>{sponsorDeck.title}</strong> presentation to your
          email. Look for the message with the button{" "}
          <strong className="text-gold">View Sponsorship Deck</strong>.
        </p>
        {demoMode && (
          <p className="mt-3 text-sm text-gold">
            Your private deck link is also available below.
          </p>
        )}
        {deckViewUrl && (
          <a
            href={deckViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-ruby px-8 py-3 text-sm font-semibold text-white transition hover:bg-ruby-light"
          >
            View Sponsorship Deck
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setDeckViewUrl(null);
            setDemoMode(false);
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
        Free sponsorship deck
      </p>
      <h3 className="mt-2 font-display text-2xl text-cream">
        Get the free sponsor package deck
      </h3>
      <p className="mt-3 text-sm text-cream/70">
        Enter your details and we&apos;ll email you a private link to the full
        Torch of Excellence presentation — every package tier, benefits, and
        partnership option for SETVA 2026.
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
        {state === "loading" ? "Sending…" : "Get free sponsor package deck"}
      </button>

      {state === "error" && <PublicErrorAlert className="mt-3" />}
    </form>
  );
}
