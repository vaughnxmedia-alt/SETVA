import Image from "next/image";
import { visionaryMagazine } from "@/lib/magazine";
import { site } from "@/lib/site";

export function MagazineHeroIntro() {
  return (
    <header className="mx-auto max-w-2xl text-center">
      <Image
        src="/setva-2026-nominations-header-transparent.png"
        alt={`${site.fullName} 2026`}
        width={1024}
        height={576}
        className="mx-auto h-auto w-full max-w-lg"
        priority
      />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.32em] text-gold">
        SETVA Digital Magazine
      </p>
      <h1 className="mt-2 font-display text-4xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:text-5xl">
        {visionaryMagazine.name}
      </h1>
      <p className="mt-4 font-display text-lg italic leading-relaxed text-white/90 sm:text-xl">
        {visionaryMagazine.tagline}
      </p>
    </header>
  );
}
