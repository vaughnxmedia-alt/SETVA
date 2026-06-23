"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HQAuthCard,
  hqAuthButtonClass,
  hqAuthInputClass,
  hqAuthLabelClass,
} from "@/components/headquarters/HQAuthCard";

export function HQRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
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
      const res = await fetch("/api/headquarters/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, accessCode }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Unable to create account.");
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
    <HQAuthCard
      title="Create account"
      subtitle="Join SETVA Headquarters with your team access code. You only enter the access code once during signup."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/headquarters/login" className="text-gold hover:text-gold/80">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label htmlFor="hq-name" className={hqAuthLabelClass}>
            Full name
          </label>
          <input
            id="hq-name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={hqAuthInputClass}
            required
          />
        </div>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={hqAuthInputClass}
            minLength={8}
            required
          />
        </div>
        <div>
          <label htmlFor="hq-confirm-password" className={hqAuthLabelClass}>
            Confirm password
          </label>
          <input
            id="hq-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={hqAuthInputClass}
            minLength={8}
            required
          />
        </div>
        <div>
          <label htmlFor="hq-access-code" className={hqAuthLabelClass}>
            Team access code
          </label>
          <input
            id="hq-access-code"
            type="password"
            autoComplete="off"
            placeholder="Provided by SETVA admin"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            className={hqAuthInputClass}
            required
          />
          <p className="mt-1.5 text-xs text-cream/40">
            One-time code from SETVA leadership. Not needed when signing in later.
          </p>
        </div>

        {error ? (
          <p className="rounded-xl border border-ruby/30 bg-ruby/10 px-4 py-3 text-sm text-cream/85">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className={hqAuthButtonClass}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </HQAuthCard>
  );
}
