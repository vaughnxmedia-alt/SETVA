import type { Metadata } from "next";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about SETVA and the movement honoring Southeast Texas visionaries.",
};

export default function AboutPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Our story"
          title="About SETVA"
          subtitle={site.tagline}
        />
        <div className="mt-10 space-y-6 text-cream/80">
          <p>
            The Southeast Texas Visionary Awards (SETVA) honors gifted individuals
            who use their voices, art, and service to make a lasting difference
            across the 409 and beyond. What began as a vision from{" "}
            {site.founders} has grown into a movement of healing, honor, and hope.
          </p>
          <p>
            SETVA is produced by {site.org}. Each year we celebrate creators, leaders, healers, and
            entrepreneurs who embody the spirit of Southeast Texas — resilient,
            vibrant, and visionary.
          </p>
          <p>
            {site.motto} Whether you attend, sponsor, vend, or donate, you help
            plant seeds our youth and communities can thrive in.
          </p>
        </div>
        <div className="card-glow mt-12 rounded-2xl bg-ink-deep/60 p-8">
          <h3 className="font-display text-xl text-gold">2026 at a glance</h3>
          <dl className="mt-4 space-y-3 text-sm text-cream/75">
            <div className="flex justify-between gap-4 border-b border-gold/10 pb-3">
              <dt>When</dt>
              <dd className="text-right text-cream">{site.event.dateLabel}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gold/10 pb-3">
              <dt>Where</dt>
              <dd className="text-right text-cream">{site.event.venue}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Format</dt>
              <dd className="text-right text-cream">
                Awards show · {site.event.time}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
