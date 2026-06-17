"use client";

import Image from "next/image";
import { useState } from "react";
import type { SponsorPackage } from "@/lib/site";

const themeStyles: Record<
  NonNullable<SponsorPackage["visualTheme"]>,
  { gradient: string; accent: string }
> = {
  title: {
    gradient: "from-black via-ruby/80 to-gold/60",
    accent: "Presenting partner",
  },
  legacy: {
    gradient: "from-ink via-ruby/50 to-gold/40",
    accent: "Legacy visibility",
  },
  stage: {
    gradient: "from-black via-ink to-ruby/70",
    accent: "On-stage moment",
  },
  "red-carpet": {
    gradient: "from-black via-ruby to-gold/50",
    accent: "Red carpet & photos",
  },
  livestream: {
    gradient: "from-ink via-black to-ruby/60",
    accent: "Mont City Network broadcast",
  },
  magazine: {
    gradient: "from-black via-gold/30 to-ruby/40",
    accent: "Print & digital",
  },
  community: {
    gradient: "from-ruby/40 via-ink to-gold/30",
    accent: "Community impact",
  },
  category: {
    gradient: "from-ink via-ruby/40 to-gold/30",
    accent: "Category naming",
  },
  supporter: {
    gradient: "from-ink via-black to-gold/25",
    accent: "Community supporter",
  },
  default: {
    gradient: "from-black via-ink to-ruby/50",
    accent: "Sponsorship benefit",
  },
};

function packageImagePath(pkg: SponsorPackage): string {
  return pkg.image ?? `/sponsors/packages/${pkg.id}.png`;
}

type SponsorPackageVisualProps = {
  pkg: SponsorPackage;
  priority?: boolean;
  /** Deck slides: image/gradient banner only — no text overlay */
  bannerOnly?: boolean;
};

export function SponsorPackageVisual({
  pkg,
  priority = false,
  bannerOnly = false,
}: SponsorPackageVisualProps) {
  const theme = pkg.visualTheme ?? "default";
  const style = themeStyles[theme];
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !imageFailed;

  if (showImage) {
    return (
      <div
        className={`relative w-full overflow-hidden bg-black ${
          bannerOnly ? "h-full rounded-none" : "aspect-[37/9] rounded-xl border border-gold/15"
        }`}
      >
        <Image
          src={packageImagePath(pkg)}
          alt={pkg.visualCaption ?? `${pkg.name} sponsorship preview`}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={priority}
          onError={() => setImageFailed(true)}
        />
        {pkg.visualCaption && !bannerOnly && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">
              {style.accent}
            </p>
            <p className="text-sm text-cream/90">{pkg.visualCaption}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-gradient-to-r ${style.gradient} ${
        bannerOnly ? "h-full rounded-none" : "aspect-[37/9] rounded-xl border border-gold/15"
      }`}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="grid h-full grid-cols-6 gap-2 p-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </div>
      <div className="relative flex h-full flex-col justify-end p-5">
        {!bannerOnly && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-gold/90">
              {style.accent}
            </p>
            <p className="mt-1 font-display text-lg text-cream sm:text-xl">
              {pkg.name}
            </p>
            {pkg.visualCaption && (
              <p className="mt-1 max-w-md text-xs text-cream/70 sm:text-sm">
                {pkg.visualCaption}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
