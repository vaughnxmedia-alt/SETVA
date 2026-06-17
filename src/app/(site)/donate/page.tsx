import type { Metadata } from "next";
import { PlaceholderNote } from "@/components/PlaceholderNote";
import { SectionHeading } from "@/components/SectionHeading";
import { DonateForm } from "./DonateForm";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support SETVA and community impact across Southeast Texas.",
};

export default function DonatePage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Give"
          title="Fuel the vision"
          subtitle="Every dollar helps honor local talent, inspire the community, and grow something our youth can thrive in."
        />
        <PlaceholderNote className="mt-8" />
        <div className="mt-12">
          <DonateForm />
        </div>
        <p className="mt-10 text-center text-sm text-cream/50">
          SETVA is presented by The Healing House of Impact™. Donations are
          processed securely through Square.
        </p>
      </div>
    </div>
  );
}
