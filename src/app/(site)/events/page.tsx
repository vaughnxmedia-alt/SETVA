import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { eventSchedule, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Events",
  description: "SETVA 2026 event schedule — August 8 at the Jefferson Theater.",
};

export default function EventsPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow={site.event.dateShort}
          title={site.event.title}
          subtitle={`${site.event.venue} · ${site.event.location}`}
        />
        <div className="mt-10 space-y-6">
          {eventSchedule.map((item, i) => (
            <article
              key={`${item.day}-${item.title}-${i}`}
              className="card-glow rounded-2xl border-l-4 border-gold/50 bg-ink-deep/60 p-6"
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-gold">
                {item.day}
              </p>
              <p className="mt-1 text-sm text-cream/50">{item.time}</p>
              <h3 className="mt-3 font-display text-xl text-cream">{item.title}</h3>
              <p className="mt-2 text-cream/70">{item.description}</p>
              {item.location && (
                <p className="mt-3 text-sm text-cream/50">📍 {item.location}</p>
              )}
            </article>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/tickets"
            className="rounded-full bg-gold px-8 py-4 font-semibold text-ink hover:bg-gold-light"
          >
            Get tickets
          </Link>
        </div>
      </div>
    </div>
  );
}
