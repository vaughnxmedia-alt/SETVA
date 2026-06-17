"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { site } from "@/lib/site";

export function HQRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/headquarters/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      if (!res.ok) {
        setError("Unable to create account.");
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
            src="/setva-logo-header-transparent.png"
            alt={site.fullName}
            width={1024}
            height={576}
            className="hq-logo-gold h-auto w-[160px] object-contain transition group-hover:scale-[1.02]"
            sizes="160px"
            priority
          />
        </Link>
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">
          Headquarters
        </p>
        <h1 className="mt-3 text-center font-display text-2xl text-cream">Create Account</h1>
        <p className="mt-2 text-center text-sm text-cream/50">Set up your team access profile.</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none focus:border-gold/50"
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
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none focus:border-gold/50"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

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
