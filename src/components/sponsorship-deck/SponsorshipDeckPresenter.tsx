"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SponsorPackageVisual } from "@/components/SponsorPackageVisual";
import {
  formatPackagePrice,
  sponsorshipDeckAssets,
  type SponsorshipDeckSlide,
} from "@/lib/sponsorship-deck";
import { brandLogos, site } from "@/lib/site";
import { packageAvailabilityLabel } from "@/lib/sponsor-inventory";

type Props = {
  slides: SponsorshipDeckSlide[];
};

function SectionSlide({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative flex h-full min-h-[70svh] flex-col items-center justify-center px-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold/90">
        SETVA 2026
      </p>
      <h2 className="mt-6 max-w-3xl font-display text-4xl leading-tight text-cream sm:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-cream/80 sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function PackageSlide({
  slide,
}: {
  slide: Extract<SponsorshipDeckSlide, { kind: "package" }>;
}) {
  const { pkg } = slide;
  const availability = packageAvailabilityLabel(pkg);

  return (
    <div className="flex h-full min-h-[70svh] flex-col">
      <div className="relative h-44 shrink-0 overflow-hidden sm:h-52 [&>div]:h-full [&>div]:rounded-none">
        <SponsorPackageVisual pkg={pkg} priority />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6 sm:px-10 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              {pkg.group === "main"
                ? "Main package"
                : pkg.group === "signature"
                  ? "Signature opportunity"
                  : "Community supporter"}
            </p>
            <h2 className="mt-2 font-display text-3xl text-cream sm:text-4xl">{pkg.name}</h2>
          </div>
          <p className="font-display text-3xl text-gold sm:text-4xl">
            {formatPackagePrice(pkg)}
          </p>
        </div>

        {availability && (
          <p className="mt-3 inline-flex w-fit rounded-full border border-gold/30 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
            {availability}
          </p>
        )}

        <p className="mt-5 max-w-3xl text-base leading-relaxed text-cream/85">
          {pkg.description}
        </p>

        {pkg.pitch && (
          <p className="mt-4 max-w-3xl border-l-2 border-gold/50 pl-4 text-sm italic text-cream/70">
            {pkg.pitch}
          </p>
        )}

        {pkg.visualCaption && (
          <p className="mt-4 text-sm text-gold/90">{pkg.visualCaption}</p>
        )}

        <ul className="mt-6 grid max-w-4xl gap-2 sm:grid-cols-2">
          {pkg.benefits.map((benefit) => (
            <li key={benefit} className="flex gap-2 text-sm text-cream/80">
              <span className="shrink-0 text-gold">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {pkg.bestFit && (
          <p className="mt-6 text-sm text-cream/55">
            <span className="font-semibold text-cream/75">Best for: </span>
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
    <div className="flex h-full min-h-[70svh] flex-col items-center justify-center px-6 text-center">
      <Image
        src={brandLogos.onDark}
        alt={site.fullName}
        width={200}
        height={112}
        className="h-auto w-44"
      />
      <h2 className="mt-8 font-display text-3xl text-cream sm:text-4xl">{title}</h2>
      <p className="mt-4 max-w-xl text-base text-cream/75">{subtitle}</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/sponsors#get-deck"
          className="rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink transition hover:bg-gold-light"
        >
          Get the sponsor deck
        </Link>
        <Link
          href="/sponsors"
          className="rounded-full border border-gold/40 px-8 py-3 text-sm font-semibold text-gold transition hover:bg-gold/10"
        >
          View all packages
        </Link>
        <Link
          href={`mailto:${site.contact.email}?subject=${encodeURIComponent("SETVA 2026 Sponsorship")}`}
          className="rounded-full bg-ruby px-8 py-3 text-sm font-semibold text-white transition hover:bg-ruby-light"
        >
          Email our team
        </Link>
      </div>
      <p className="mt-8 text-sm text-cream/50">
        {site.event.dateLabel} · {site.event.venue} · {site.event.location}
      </p>
    </div>
  );
}

export function SponsorshipDeckPresenter({ slides }: Props) {
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

  const showGradientBackground = slide.kind !== "cover";

  return (
    <div className="relative min-h-svh bg-black text-cream">
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={brandLogos.onDark}
            alt={site.name}
            width={120}
            height={68}
            className="h-auto w-24 sm:w-28"
            priority
          />
        </Link>
        <p className="rounded-full border border-gold/25 bg-black/50 px-3 py-1 text-xs font-medium text-cream/70 backdrop-blur-sm">
          {index + 1} / {slides.length}
        </p>
      </header>

      <div className="relative mx-auto flex min-h-svh max-w-5xl flex-col justify-center px-3 pb-24 pt-20 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-gold/20 shadow-2xl shadow-black/60">
          {showGradientBackground && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${sponsorshipDeckAssets.sectionBackground})` }}
              aria-hidden
            />
          )}

          <div className="relative">
            {slide.kind === "cover" && (
              <div className="relative aspect-[9/16] w-full sm:aspect-[16/10]">
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  className="object-cover object-center"
                  priority
                  sizes="(max-width: 768px) 100vw, 1024px"
                />
              </div>
            )}

            {slide.kind === "section" && (
              <SectionSlide title={slide.title} subtitle={slide.subtitle} />
            )}

            {slide.kind === "package" && <PackageSlide slide={slide} />}

            {slide.kind === "closing" && (
              <ClosingSlide title={slide.title} subtitle={slide.subtitle} />
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-2 sm:px-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={isFirst}
          aria-label="Previous slide"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-black/70 text-2xl text-gold backdrop-blur-sm transition hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-30 sm:h-14 sm:w-14"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={isLast}
          aria-label="Next slide"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-black/70 text-2xl text-gold backdrop-blur-sm transition hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-30 sm:h-14 sm:w-14"
        >
          ›
        </button>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-20 border-t border-gold/10 bg-black/80 px-4 py-3 text-center text-xs text-cream/45 backdrop-blur-sm">
        {site.motto} · Use arrow keys or tap the arrows to navigate
      </footer>
    </div>
  );
}
