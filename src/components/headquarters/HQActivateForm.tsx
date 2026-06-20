"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { brandLogos, site } from "@/lib/site";

export function HQActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetEmail = searchParams.get("email") ?? "";

  const [setvaId, setSetvaId] = useState("");
  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/headquarters/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setvaId, email, password }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Unable to activate account.");
        return;
      }

      router.push("/headquarters");
      router.refresh();
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
        <h1 className="mt-3 text-center font-display text-2xl text-cream">Create Account</h1>
        <p className="mt-2 text-center text-sm text-cream/50">
          Enter the SETVA ID from your approval email to finish setup.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
          <input
            placeholder="SETVA ID (e.g. SETVA-0001)"
            value={setvaId}
            onChange={(e) => setSetvaId(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-gold/20 bg-black/40 px-4 py-3 font-mono text-cream outline-none focus:border-gold/50"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none focus:border-gold/50"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none focus:border-gold/50"
            minLength={8}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none focus:border-gold/50"
            minLength={8}
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
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-cream/45">
          Need access?{" "}
          <Link href="/headquarters/request-access" className="text-gold hover:text-gold/80">
            Request access
          </Link>
          {" · "}
          <Link href="/headquarters/login" className="text-gold hover:text-gold/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
