"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HERO_COPY_HIDE_EVENT,
  HERO_COPY_REVEAL_EVENT,
} from "@/components/HomeHeroVideo";
import { site } from "@/lib/site";
import { TicketPurchaseLink } from "@/components/TicketPurchaseLink";
import { VotingStartsNotice } from "@/components/VotingStartsNotice";

export function HomeHeroCopy() {
  const [hidden, setHidden] = useState(false);
  const [revealKey, setRevealKey] = useState(0);

  useEffect(() => {
    function onHide() {
      setHidden(true);
    }

    function onReveal() {
      setHidden(false);
      setRevealKey((key) => key + 1);
    }

    window.addEventListener(HERO_COPY_HIDE_EVENT, onHide);
    window.addEventListener(HERO_COPY_REVEAL_EVENT, onReveal);
    return () => {
      window.removeEventListener(HERO_COPY_HIDE_EVENT, onHide);
      window.removeEventListener(HERO_COPY_REVEAL_EVENT, onReveal);
    };
  }, []);

  return (
    <div
      key={revealKey}
      className={`hero-copy w-full max-w-md overflow-hidden rounded-[2rem] bg-black shadow-2xl ring-1 ring-white/10 sm:max-w-lg lg:max-w-2xl ${
        hidden ? "hero-copy--hidden" : ""
      } ${revealKey > 0 ? "hero-copy--replay" : ""}`}
    >
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
          <TicketPurchaseLink
            label="Buy Tickets"
            mode="nav"
            className="rounded-full bg-ruby px-6 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-white hover:text-ruby"
            externalClassName="rounded-full bg-ruby px-6 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-white hover:text-ruby"
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sponsors"
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Become a Sponsor
            </Link>
            <Link
              href="/nominations"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-black shadow-lg transition hover:bg-gold-light"
            >
              Vote
            </Link>
          </div>
          <VotingStartsNotice className="text-xs sm:text-sm" />
        </div>
      </div>
    </div>
  );
}
