import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <section
        className="hero-gradient relative overflow-hidden"
        aria-label="SETVA 2026 — Southeast Texas Visionary Awards"
      >
        <div className="relative mx-auto w-full max-w-3xl px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="hero-image-frame">
            <Image
              src="/hero-visionary-awards-2026.jpg"
              alt="Southeast Texas Visionary Awards 2026 — Honoring Excellence, Inspiring Impact"
              width={1024}
              height={682}
              priority
              className="hero-image-blend h-auto w-full"
              sizes="(max-width: 768px) 100vw, 768px"
            />
            <div
              className="hero-banner-fade pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
              aria-hidden
            />
          </div>
        </div>

        <div className="relative z-10 -mt-8 px-4 pb-16 sm:-mt-10 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-6xl">
            <p className="sr-only">{site.fullName} 2026</p>
            <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.25em] text-gold sm:text-left">
              ✨ Southeast Texas, it&apos;s time to shine ✨
            </p>
            <p className="mx-auto max-w-2xl text-center text-lg text-cream/95 sm:mx-0 sm:text-left sm:text-xl">
              {site.tagline}
            </p>
            <p className="mt-3 text-center font-display text-xl italic text-gold sm:text-left">
              {site.motto}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-start">
              <Link
                href="/tickets"
                className="rounded-full bg-gold px-8 py-4 text-base font-semibold text-ink shadow-lg transition hover:bg-gold-light"
              >
                Buy Tickets
              </Link>
              <Link
                href="/sponsors"
                className="rounded-full border border-gold/60 bg-ink/40 px-8 py-4 text-base font-semibold text-gold backdrop-blur-sm transition hover:bg-gold/10"
              >
                Become a Sponsor
              </Link>
              <Link
                href="/donate"
                className="rounded-full bg-ruby px-8 py-4 text-base font-semibold text-cream shadow-lg transition hover:bg-ruby-light"
              >
                Donate
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gold/10 bg-ink-deep/50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="The Movement"
            title="Experience the vibrance of Southeast Texas"
            subtitle="A healed individual becomes a ripple of change. A recognized gift becomes a movement. SETVA exists to light that fire."
          />
          <div className="mx-auto mt-12 max-w-3xl space-y-6 text-center text-cream/75">
            <p>
              This powerful weekend honors gifted individuals using their voices,
              art, and service to make a lasting difference in Southeast Texas
              and beyond. The Southeast Texas Visionary Awards is more than a red
              carpet event — it is a movement of healing, honor, and hope.
            </p>
            <p className="text-gold/90">
              Presented by {site.event.presenter}
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow={site.event.dateShort}
            title={site.event.title}
            subtitle={`${site.event.dateLabel} · ${site.event.time} · ${site.event.location}`}
          />
          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/events" className="text-gold hover:underline">
              Event schedule →
            </Link>
            <Link href="/nominees" className="text-gold hover:underline">
              Sample nominees →
            </Link>
            <Link href="/about" className="text-gold hover:underline">
              Our story →
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Celebrate",
                text: "Honor the visionaries shaping our communities.",
              },
              {
                title: "Elevate",
                text: "Spotlight talent across arts, service, and leadership.",
              },
              {
                title: "Unify",
                text: "Let's vivify the 409, together.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="card-glow rounded-2xl bg-ink-deep/80 p-6 text-center"
              >
                <h3 className="font-display text-xl text-gold">{item.title}</h3>
                <p className="mt-3 text-sm text-cream/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-deep/80 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <blockquote className="font-display text-xl italic leading-relaxed text-cream/90 sm:text-2xl">
            &ldquo;This isn&apos;t just a show. It&apos;s a seed. And every vote,
            every dollar, every voice helps this seed grow into something our youth
            and communities can thrive in. Thank you for walking with us.&rdquo;
          </blockquote>
          <p className="mt-6 text-gold">
            — {site.founders}, Founders of {site.name}
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-ruby/10 p-8 sm:p-12">
          <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
            <div className="flex-1">
              <h2 className="font-display text-2xl text-cream sm:text-3xl">
                Ticket Partner Program
              </h2>
              <p className="mt-3 text-cream/75">
                Earn 20% on every ticket you sell. Share your custom link, get
                credited for sales, and receive earnings after the event.
              </p>
            </div>
            <Link
              href="/ticket-partners"
              className="shrink-0 rounded-full bg-gold px-8 py-4 font-semibold text-ink hover:bg-gold-light"
            >
              Become a Ticket Partner
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-gold/10 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <SectionHeading
            title="Stay in the loop"
            subtitle="Be the first to hear about ticket sales, Early Bird offers, and our lineup."
          />
          <p className="mt-6">
            <a
              href={site.social.linktree}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold underline-offset-4 hover:underline"
            >
              Follow us on Linktree →
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
