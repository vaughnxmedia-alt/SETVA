"use client";

import { useState } from "react";

type CheckoutButtonProps = {
  type: "ticket" | "donation" | "sponsor" | "vendor";
  itemId: string;
  quantity?: number;
  amount?: number;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
};

export function CheckoutButton({
  type,
  itemId,
  quantity = 1,
  amount,
  label = "Checkout",
  className = "",
  variant = "primary",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseStyles =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary: "bg-gold text-ink hover:bg-gold-light",
    secondary:
      "bg-ruby text-cream shadow-lg hover:bg-ruby-light",
    outline:
      "border border-gold/50 text-gold hover:bg-gold/10",
  };

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, itemId, quantity, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Checkout failed");
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={`${baseStyles} ${variants[variant]} ${className}`}
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
