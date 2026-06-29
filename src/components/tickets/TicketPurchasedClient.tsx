"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function TicketPurchasedClient() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const [status, setStatus] = useState<"pending" | "recorded" | "error">("pending");

  useEffect(() => {
    let cancelled = false;
    async function recordPurchase() {
      try {
        const res = await fetch("/api/ticket-partner/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: ref || undefined }),
        });
        if (!cancelled) {
          setStatus(res.ok ? "recorded" : "error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    void recordPurchase();
    return () => {
      cancelled = true;
    };
  }, [ref]);

  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center text-cream">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">SETVA 2026</p>
      <h1 className="mt-3 font-display text-3xl text-cream">Thank you for your ticket purchase</h1>
      <p className="mt-4 text-sm text-cream/70">
        {status === "pending"
          ? "Recording your purchase for ticket partner analytics…"
          : status === "recorded"
            ? "Your purchase has been attributed to the partner who shared their SETVA ticket link."
            : "We could not record partner attribution right now, but your Ticketmaster purchase is still valid."}
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/"
          className="rounded-full border border-gold/30 px-5 py-2 text-sm text-gold hover:bg-gold/10"
        >
          Back to SETVA
        </Link>
        <Link
          href="/nominations"
          className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-ink hover:bg-gold/90"
        >
          Meet the nominees
        </Link>
      </div>
    </main>
  );
}
