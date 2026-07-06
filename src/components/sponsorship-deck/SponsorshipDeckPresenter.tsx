"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MontCityNetworkBadge } from "@/components/MontCityNetworkBadge";
import { SponsorPackageVisual } from "@/components/SponsorPackageVisual";
import {
  formatPackagePrice,
  type SponsorshipDeckSlide,
} from "@/lib/sponsorship-deck";
import { brandLogos, site } from "@/lib/site";
import {
  isPackageSoldOut,
  packageAvailabilityLabel,
} from "@/lib/sponsor-inventory";

type Props = {
  slides: SponsorshipDeckSlide[];
  preparedFor?: { name: string; email: string };
};

const slideFrame =
  "relative flex aspect-[9/16] w-full max-w-[540px] flex-col overflow-hidden rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)]";

const slideGradient =
  "bg-[linear-gradient(165deg,#facd68_0%,#f59e0b_18%,#bf0000_52%,#1a0000_100%)]";

function groupLabel(group: "main" | "signature" | "supporter"): string {
  if (group === "main") return "Main package";
  if (group === "signature") return "Signature opportunity";
  return "Community supporter";
}

function SlideShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${slideFrame} ${slideGradient} ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.22),transparent_42%)]" />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function CoverSlide({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <SlideShell className="text-center">
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-10">
        <Image
          src={brandLogos.onDark}
          alt={site.fullName}
          width={280}
          height={158}
          className="h-auto w-48 sm:w-56"
          priority
        />
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.32em] text-white/85">
          SETVA 2026
        </p>
        <h2 className="mt-5 font-display text-4xl leading-tight text-white">{title}</h2>
        <p className="mt-5 max-w-xs text-base leading-relaxed text-white/85">{subtitle}</p>
        <div className="mt-10 w-full max-w-xs rounded-2xl border border-white/20 bg-black/25 px-5 py-4 backdrop-blur-sm">
          <p className="text-sm font-semibold text-gold">{site.event.dateLabel}</p>
          <p className="mt-1 text-sm text-white/80">
            {site.event.venue} · {site.event.location}
          </p>
        </div>
      </div>
    </SlideShell>
  );
}

function SectionSlide({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <SlideShell>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-gold">SETVA 2026</p>
        <h2 className="mt-6 font-display text-4xl leading-tight text-white">{title}</h2>
        {subtitle && (
          <p className="mt-5 max-w-sm text-base leading-relaxed text-white/85">{subtitle}</p>
        )}
      </div>
    </SlideShell>
  );
}

function PackageSlide({
  slide,
}: {
  slide: Extract<SponsorshipDeckSlide, { kind: "package" }>;
}) {
  const { pkg } = slide;
  const soldOut = isPackageSoldOut(pkg);
  const availability = packageAvailabilityLabel(pkg);

  return (
    <div
      className={`${slideFrame} flex flex-col overflow-hidden border border-gold/20 bg-[#0b0000]`}
    >
      <div
        className="h-1 shrink-0 bg-[linear-gradient(90deg,#facd68_0%,#f59e0b_35%,#bf0000_70%,#1a0000_100%)]"
        aria-hidden
      />

      <div className="shrink-0 border-b border-white/10 bg-black px-5 pb-4 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          {groupLabel(pkg.group)}
        </p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl leading-tight text-white">{pkg.name}</h2>
          <p className="shrink-0 font-display text-2xl text-gold">{formatPackagePrice(pkg)}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {soldOut && (
            <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Sold out
            </span>
          )}
          {!soldOut && availability && (
            <span className="rounded-full border border-gold/50 bg-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
              {availability}
            </span>
          )}
          {pkg.highlighted && !soldOut && (
            <span className="rounded-full bg-gold/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
              Recommended
            </span>
          )}
          {pkg.featured && !pkg.highlighted && !soldOut && (
            <span className="rounded-full bg-ruby/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              High demand
            </span>
          )}
        </div>
      </div>

      <div className="relative h-28 shrink-0 overflow-hidden [&>div]:h-full [&>div]:rounded-none [&>div]:border-0">
        <SponsorPackageVisual pkg={pkg} priority bannerOnly />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#120000] px-5 py-4">
        <p className="text-sm leading-relaxed text-white">{pkg.description}</p>

        {pkg.pitch && (
          <p className="mt-3 rounded-xl border border-gold/25 bg-black/40 px-4 py-3 text-sm italic leading-relaxed text-white/90">
            &ldquo;{pkg.pitch}&rdquo;
          </p>
        )}

        {pkg.visualCaption && (
          <p className="mt-3 text-xs leading-relaxed text-gold">{pkg.visualCaption}</p>
        )}

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
            What you receive
          </p>
          <ul className="mt-3 space-y-2">
            {pkg.benefits.map((benefit) => (
              <li key={benefit} className="flex gap-2 text-sm text-white/90">
                <span className="shrink-0 text-gold">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {pkg.montCityMedia && (
          <div className="mt-4 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <p className="text-[10px] uppercase tracking-wider text-white/60">
              Broadcast partner
            </p>
            <MontCityNetworkBadge bare />
          </div>
        )}

        {pkg.bestFit && (
          <p className="mt-5 text-xs leading-relaxed text-white/75">
            <span className="font-semibold uppercase tracking-wider text-gold">
              Best for:{" "}
            </span>
            {pkg.bestFit}
          </p>
        )}
      </div>
    </div>
  );
}

function ClosingSlide({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <SlideShell>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
        <Image
          src={brandLogos.onDark}
          alt={site.fullName}
          width={200}
          height={112}
          className="h-auto w-40"
        />
        <h2 className="mt-6 font-display text-3xl text-white">{title}</h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/85">{subtitle}</p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/sponsors"
            className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold-light"
          >
            Browse packages &amp; buy
          </Link>
          <Link
            href={`mailto:${site.contact.email}?subject=${encodeURIComponent("SETVA 2026 Sponsorship")}`}
            className="rounded-full bg-ruby px-6 py-3 text-sm font-semibold text-white transition hover:bg-ruby-light"
          >
            Email our team
          </Link>
        </div>
        <p className="mt-8 text-xs text-white/55">
          {site.event.dateLabel} · {site.event.venue}
        </p>
      </div>
    </SlideShell>
  );
}

export function SponsorshipDeckPresenter({ slides, preparedFor }: Props) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isFirst = index === 0;
  const isLast = index === slides.length - 1;

  const goNext = useCallback(() => {
    setIndex((current) => Math.min(current + 1, slides.length - 1));
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setIndex((current) => Math.max(current - 1, 0));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        goNext();
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goPrev();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev]);

  return (
    <div className="min-h-svh bg-white text-ink">
      <header className="border-b border-black/5 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={brandLogos.onLight}
              alt={site.name}
              width={120}
              height={68}
              className="h-auto w-24"
              priority
            />
          </Link>
          <div className="text-right">
            {preparedFor ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ruby">
                  Prepared for
                </p>
                <p className="text-sm font-medium text-ink">{preparedFor.name}</p>
              </>
            ) : (
              <p className="text-sm font-medium text-ink/70">{sponsorDeckTitle()}</p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-8 sm:px-6 sm:py-10">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-ink/45">
          {site.event.title} · {site.event.dateLabel}
        </p>

        <div key={slide.id} className="w-full">
          {slide.kind === "cover" && (
            <CoverSlide title={slide.title} subtitle={slide.subtitle} />
          )}
          {slide.kind === "section" && (
            <SectionSlide title={slide.title} subtitle={slide.subtitle} />
          )}
          {slide.kind === "package" && <PackageSlide slide={slide} />}
          {slide.kind === "closing" && (
            <ClosingSlide title={slide.title} subtitle={slide.subtitle} />
          )}
        </div>

        <div className="mt-8 flex w-full max-w-[540px] flex-col items-center gap-4">
          <p className="text-sm text-ink/50">
            Slide {index + 1} of {slides.length}
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirst}
              className="w-full rounded-full border border-ink/15 px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-35 sm:w-1/3"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={isLast}
              className="w-full rounded-full bg-ruby px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-ruby/20 transition hover:bg-ruby-light disabled:cursor-not-allowed disabled:opacity-35 sm:flex-1"
            >
              {isLast ? "End of deck" : "Next"}
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-black/5 px-4 py-6 text-center text-xs text-ink/40">
        {site.motto}
        {preparedFor ? " · Private presentation link" : null}
      </footer>
    </div>
  );
}

function sponsorDeckTitle(): string {
  return "Sponsorship Deck";
}
