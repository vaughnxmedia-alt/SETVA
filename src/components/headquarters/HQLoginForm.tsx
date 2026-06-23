"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  HQAuthCard,
  hqAuthButtonClass,
  hqAuthInputClass,
  hqAuthLabelClass,
} from "@/components/headquarters/HQAuthCard";

export function HQLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/headquarters";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/headquarters/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Invalid email or password.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Error. Please contact support.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <HQAuthCard
      title="Sign in"
      subtitle="Enter your email and password to access SETVA Headquarters."
      footer={
        <>
          New team member?{" "}
          <Link href="/headquarters/register" className="text-gold hover:text-gold/80">
            Create account
          </Link>
        </>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        <div>
          <label htmlFor="hq-email" className={hqAuthLabelClass}>
            Email
          </label>
          <input
            id="hq-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={hqAuthInputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="hq-password" className={hqAuthLabelClass}>
            Password
          </label>
          <input
            id="hq-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={hqAuthInputClass}
            required
          />
        </div>

        {error ? (
          <p className="rounded-xl border border-ruby/30 bg-ruby/10 px-4 py-3 text-sm text-cream/85">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className={hqAuthButtonClass}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </HQAuthCard>
  );
}
