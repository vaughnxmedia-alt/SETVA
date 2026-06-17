"use client";

import { useState } from "react";
import { PublicErrorAlert } from "@/components/PublicErrorAlert";

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
  const [showError, setShowError] = useState(false);

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
    setShowError(false);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, itemId, quantity, amount }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        if (process.env.NODE_ENV === "development") {
          console.error("Checkout API failure:", data);
        }
        setShowError(true);
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setShowError(true);
        setLoading(false);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Checkout client error:", error);
      }
      setShowError(true);
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
      {showError && <PublicErrorAlert className="text-center" />}
    </div>
  );
}
