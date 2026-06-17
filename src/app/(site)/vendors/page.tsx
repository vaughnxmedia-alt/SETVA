import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { VendorSlotPicker } from "@/components/vendors/VendorSlotPicker";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vendor Slots",
  description: "Apply for vendor slots at SETVA 2026 — bartenders, food truck, spinning camera, and more.",
};

export default function VendorsPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Now seeking vendors"
          title="Vendor opportunities"
          subtitle={`Showcase your business at ${site.event.title} — ${site.event.venue}, ${site.event.dateLabel}.`}
        />

        <div className="mt-10">
          <VendorSlotPicker />
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-sm text-cream/50">
          Questions about other vendor opportunities?{" "}
          <Link href="/contact?subject=vendor" className="text-gold hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
