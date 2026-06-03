import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/SectionHeading";
import { site, sponsorPackages } from "@/lib/site";

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
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/setva-awards-poster.png"
          aria-hidden="true"
        >
          <source src="/setva-awards-header.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.34)_0%,rgba(191,0,0,0.08)_42%,rgba(255,255,255,0.94)_100%)]" />
        <Image
          src="/setva-hero-background.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-72px)] max-w-6xl flex-col justify-end px-4 pb-12 pt-8 sm:min-h-[calc(100svh-80px)] sm:px-6 sm:pb-16 lg:justify-center">
          <div className="hero-copy w-full max-w-md overflow-hidden rounded-[2rem] bg-black shadow-2xl ring-1 ring-white/10 sm:max-w-lg lg:max-w-2xl">
            <Image
              src="/setva-hero-card.png"
              alt="Southeast Texas Visionary Awards 2026"
              width={819}
              height={1024}
              priority
              className="h-auto w-full lg:hidden"
              sizes="(max-width: 768px) 90vw, 512px"
            />
            <Image
              src="/setva-hero-card-wide.png"
              alt="Southeast Texas Visionary Awards 2026"
              width={1024}
              height={576}
              priority
              className="hidden h-auto w-full lg:block"
              sizes="672px"
            />
            <div className="relative -mt-24 bg-gradient-to-t from-black via-black/90 to-transparent px-6 pb-8 pt-12 sm:-mt-28 sm:px-8 lg:-mt-16 lg:pt-16">
              <p className="sr-only">{site.fullName} 2026</p>
              <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">
                Southeast Texas, it&apos;s time to shine
              </p>
              <p className="mt-3 text-center text-base text-white/90 sm:text-lg">
                {site.tagline}
              </p>
              <p className="mt-2 text-center font-display text-lg italic text-gold">
                {site.motto}
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/tickets"
                  className="rounded-full bg-ruby px-6 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-white hover:text-ruby"
                >
                  Buy Tickets
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/sponsors"
                    className="rounded-full border border-white/40 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Become a Sponsor
                  </Link>
                  <Link
                    href="/donate"
                    className="rounded-full bg-gold px-6 py-3 text-center text-sm font-semibold text-black shadow-lg transition hover:bg-gold-light"
                  >
                    Donate
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mt-4 border-y border-ruby/10 bg-white/75 px-4 py-16 text-black backdrop-blur-[2px] sm:mt-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="The Movement"
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
            <p className="text-ruby">
              Presented by {site.event.presenter}
            </p>
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

      <section className="relative mt-4 bg-black/45 px-4 py-16 backdrop-blur-[2px] sm:mt-6 sm:px-6">
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

      <section className="relative mt-4 bg-[linear-gradient(135deg,rgba(0,0,0,0.62)_0%,rgba(191,0,0,0.55)_100%)] px-4 py-16 backdrop-blur-[2px] sm:mt-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Partner with us"
            title="Become a SETVA sponsor"
            subtitle="Put your brand at the heart of Southeast Texas's biggest night of recognition. Every partnership fuels the movement and reaches thousands across the 409."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {sponsorPackages
              .filter((pkg) => pkg.id !== "custom")
              .map((pkg) => (
                <div
                  key={pkg.id}
                  className={`card-glow flex flex-col rounded-2xl bg-black/55 p-6 ${
                    pkg.highlighted ? "ring-2 ring-gold/60" : ""
                  }`}
                >
                  {pkg.highlighted && (
                    <span className="mb-3 inline-block w-fit rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-display text-xl text-cream">{pkg.name}</h3>
                  <p className="mt-2 text-2xl font-semibold text-gold">
                    ${pkg.price.toLocaleString()}
                  </p>
                  <p className="mt-3 flex-1 text-sm text-cream/70">
                    {pkg.description}
                  </p>
                </div>
              ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sponsors"
              className="rounded-full bg-gold px-8 py-4 text-center text-base font-semibold text-black shadow-lg transition hover:bg-gold-light"
            >
              View Sponsor Packages
            </Link>
            <Link
              href="/contact?subject=sponsorship"
              className="rounded-full border border-cream/40 px-8 py-4 text-center text-base font-semibold text-cream transition hover:bg-white/10"
            >
              Request a custom package
            </Link>
          </div>
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
                Earn 20% on every ticket you sell. Share your custom link, get
                credited for sales, and receive earnings after the event.
              </p>
            </div>
            <Link
              href="/ticket-partners"
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
            subtitle="Be the first to hear about ticket sales, Early Bird offers, and our lineup."
            tone="light"
          />
          <p className="mt-6">
            <a
              href={site.social.linktree}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-black underline-offset-4 hover:underline"
            >
              Follow us on Linktree →
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
