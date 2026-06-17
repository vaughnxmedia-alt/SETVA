"use client";

import Link from "next/link";
import { useState } from "react";
import { vendorSlotOptions } from "@/lib/site";

const fieldClass =
  "mt-2 w-full rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-cream outline-none transition focus:border-gold/50";

export function VendorSlotPicker() {
  const [slotId, setSlotId] = useState<string>(vendorSlotOptions[0].id);
  const selected =
    vendorSlotOptions.find((slot) => slot.id === slotId) ?? vendorSlotOptions[0];

  return (
    <div className="card-glow mx-auto max-w-xl rounded-2xl bg-ink-deep/70 p-6 sm:p-8">
      <h3 className="font-display text-xl text-cream">Apply for a vendor slot</h3>
      <p className="mt-2 text-sm text-cream/65">
        Select the opportunity you&apos;re interested in, then continue to contact our team.
      </p>

      <label className="mt-6 block">
        <span className="text-sm font-medium text-cream/90">Vendor slot</span>
        <select
          className={fieldClass}
          value={slotId}
          onChange={(event) => setSlotId(event.target.value)}
        >
          {vendorSlotOptions.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-5 rounded-xl border border-gold/15 bg-black/25 px-4 py-4">
        <p className="text-sm text-cream/80">{selected.description}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gold">
          {selected.availability}
        </p>
      </div>

      <Link
        href={`/contact?subject=${selected.id}`}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gold px-8 py-4 font-semibold text-ink transition hover:bg-gold-light"
      >
        Apply for {selected.label}
      </Link>
    </div>
  );
}
