import type { Metadata } from "next";
import { SectionHeading } from "@/components/SectionHeading";
import { nominees } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nominees",
  description: "Meet the visionary honorees — SETVA 2026 (sample lineup).",
};

export default function NomineesPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Honorees"
          title="2026 Visionaries"
          subtitle="Sample nominees for preview — final honorees will be announced closer to the event."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {nominees.map((person) => (
            <article
              key={person.id}
              className="card-glow rounded-2xl bg-ink-deep/60 p-6"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-2xl font-display text-gold">
                {person.name.charAt(0)}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gold">
                {person.category}
              </p>
              <h3 className="mt-1 font-display text-xl text-cream">{person.name}</h3>
              <p className="text-sm text-cream/50">{person.city}, TX</p>
              <p className="mt-3 text-sm text-cream/70">{person.bio}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
