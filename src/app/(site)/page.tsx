import Image from "next/image";
import Link from "next/link";
import { HomeHeroCopy } from "@/components/HomeHeroCopy";
import { HomeHeroVideo } from "@/components/HomeHeroVideo";
import { SectionHeading } from "@/components/SectionHeading";
import { site, ticketPartnerInfo } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <div aria-hidden className="page-backdrop pointer-events-none fixed inset-0 -z-10">
        <div className="flex h-full flex-col">
          <div className="relative flex-1">
            <Image src="/setva-bg-1.png" alt="" fill className="object-cover object-center" sizes="100vw" />
          </div>
          <div className="relative flex-1">
            <Image src="/setva-bg-2.png" alt="" fill className="object-cover object-center" sizes="100vw" />
          </div>
          <div className="relative flex-1">
            <Image src="/setva-bg-3.png" alt="" fill className="object-cover object-center" sizes="100vw" />
          </div>
        </div>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <section
        className="brand-hero relative overflow-hidden bg-white"
        aria-label="SETVA 2026 — Southeast Texas Visionary Awards"
      >
        <HomeHeroVideo />
        <div className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(0,0,0,0.34)_0%,rgba(191,0,0,0.08)_42%,rgba(255,255,255,0.94)_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-72px)] max-w-6xl flex-col justify-end px-4 pb-12 pt-8 sm:min-h-[calc(100svh-80px)] sm:px-6 sm:pb-16 lg:justify-center">
          <HomeHeroCopy />
        </div>
      </section>

      <section className="relative mt-4 border-y border-ruby/10 bg-white/75 px-4 py-16 text-black backdrop-blur-[2px] sm:mt-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="The Movement"
            eyebrowClassName="text-ruby"
            title="Experience the vibrance of Southeast Texas"
            subtitle="A healed individual becomes a ripple of change. A recognized gift becomes a movement. SETVA exists to light that fire."
            tone="light"
          />
          <div className="mx-auto mt-12 max-w-3xl space-y-6 text-center text-black/75">
            <p>
              This powerful weekend honors gifted individuals using their voices,
              art, and service to make a lasting difference in Southeast Texas
              and beyond. The Southeast Texas Visionary Awards is more than a red
              carpet event — it is a movement of healing, honor, and hope.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-4xl">
            <p className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-ruby">
              Relive last year&apos;s event
            </p>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-ruby/15 bg-black shadow-xl">
              <iframe
                src="https://www.youtube.com/embed/azRMNqjWrus?start=9"
                title="SETVA — Southeast Texas Visionary Awards (previous year)"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative mt-4 bg-[linear-gradient(135deg,rgba(191,0,0,0.6)_0%,rgba(0,0,0,0.62)_100%)] px-4 py-16 backdrop-blur-[2px] sm:mt-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow={site.event.dateShort}
            title={site.event.title}
            subtitle={`${site.event.dateLabel} · ${site.event.time} · ${site.event.location}`}
          />
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

      <section className="relative mt-4 bg-black/45 px-4 py-16 backdrop-blur-[2px] sm:mt-6 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <blockquote className="font-display text-xl italic leading-relaxed text-gold sm:text-2xl">
            &ldquo;This isn&apos;t just a show. It&apos;s a seed. And every vote,
            every dollar, every voice helps this seed grow into something our youth
            and communities can thrive in. Thank you for walking with us.&rdquo;
          </blockquote>
          <p className="mt-6 text-gold">
            — {site.founders}, Founders of {site.name}
          </p>
        </div>
      </section>

      <section className="relative mt-4 bg-[linear-gradient(135deg,rgba(0,0,0,0.62)_0%,rgba(191,0,0,0.55)_100%)] px-4 py-16 backdrop-blur-[2px] sm:mt-6 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            eyebrow="Partner with us"
            title="Become a SETVA sponsor"
            subtitle="Put your brand at the heart of Southeast Texas's biggest night of recognition. View every package tier and get the free Torch of Excellence sponsorship deck sent to your inbox."
          />
          <Link
            href="/sponsors#get-deck"
            className="mt-10 inline-flex rounded-full bg-gold px-8 py-4 text-base font-semibold text-black shadow-lg transition hover:bg-gold-light"
          >
            Get Free Sponsor Package Deck
          </Link>
        </div>
      </section>

      <section className="relative mt-4 bg-white/75 px-4 py-16 text-black backdrop-blur-[2px] sm:mt-6 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-ruby/15 bg-gradient-to-br from-gold/40 to-ruby/15 p-8 shadow-xl sm:p-12">
          <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
            <div className="flex-1">
              <h2 className="font-display text-2xl text-black sm:text-3xl">
                Ticket Partner Program
              </h2>
              <p className="mt-3 text-black/75">
                Earn {ticketPartnerInfo.commissionPercent}% on every ticket you sell. Share your custom link, get
                credited for sales, and receive earnings after the event.
              </p>
            </div>
            <Link
              href="/ambassadors"
              className="shrink-0 rounded-full bg-ruby px-8 py-4 font-semibold text-white hover:bg-black"
            >
              Become a Ticket Partner
            </Link>
          </div>
        </div>
      </section>

      <section className="relative mt-4 border-t border-ruby/10 bg-white/75 px-4 py-16 text-black backdrop-blur-[2px] sm:mt-6 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <SectionHeading
            title="Stay in the loop"
            subtitle="Be the first to hear about ticket pre-sales, VIP access, and our lineup."
            tone="light"
          />
          <p className="mt-6">
            <Link
              href={site.social.hub}
              className="font-semibold text-black underline-offset-4 hover:underline"
            >
              Connect with us →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
