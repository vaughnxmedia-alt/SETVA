"use client";

import { useState } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { donationAmounts } from "@/lib/site";

export function DonateForm() {
  const [selected, setSelected] = useState<number | "custom">(50);
  const [customAmount, setCustomAmount] = useState("");

  const amount =
    selected === "custom"
      ? parseFloat(customAmount) || 0
      : selected;

  return (
    <div className="mx-auto max-w-lg">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {donationAmounts.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelected(value)}
            className={`rounded-xl border py-4 text-lg font-semibold transition ${
              selected === value
                ? "border-gold bg-gold/15 text-gold"
                : "border-gold/20 text-cream/80 hover:border-gold/40"
            }`}
          >
            ${value}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSelected("custom")}
          className={`col-span-3 rounded-xl border py-4 text-lg font-semibold transition sm:col-span-5 ${
            selected === "custom"
              ? "border-gold bg-gold/15 text-gold"
              : "border-gold/20 text-cream/80 hover:border-gold/40"
          }`}
        >
          Custom amount
        </button>
      </div>

      {selected === "custom" && (
        <div className="mt-4">
          <label htmlFor="custom-amount" className="sr-only">
            Custom donation amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/50">
              $
            </span>
            <input
              id="custom-amount"
              type="number"
              min="1"
              step="1"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full rounded-xl border border-gold/20 bg-ink-deep py-4 pl-8 pr-4 text-cream outline-none focus:border-gold"
            />
          </div>
        </div>
      )}

      <div className="mt-8">
        <CheckoutButton
          type="donation"
          itemId="donation"
          amount={amount}
          label={amount >= 1 ? `Preview donate $${amount}` : "Enter an amount"}
          variant="secondary"
          className="w-full"
        />
      </div>
    </div>
  );
}
