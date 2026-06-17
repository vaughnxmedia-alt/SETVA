import type { Metadata } from "next";
import { SectionHeading } from "@/components/SectionHeading";
import { faqItems } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about SETVA 2026.",
};

export default function FAQPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Help"
          title="Frequently asked questions"
          subtitle="Answers for preview mode and SETVA 2026 planning."
        />
        <dl className="mt-12 space-y-6">
          {faqItems.map((item) => (
            <div
              key={item.q}
              className="card-glow rounded-2xl bg-ink-deep/60 p-6"
            >
              <dt className="font-display text-lg text-gold">{item.q}</dt>
              <dd className="mt-3 text-cream/75">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
