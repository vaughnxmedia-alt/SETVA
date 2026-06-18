"use client";

import Image from "next/image";
import { useState } from "react";
import type { NominationCategory } from "@/lib/nominations";

export function NominationCategoryShowcase({
  category,
  index,
}: {
  category: NominationCategory;
  index: number;
}) {
  const [slide, setSlide] = useState(0);
  const total = category.imageSrcs.length;

  function goPrev() {
    setSlide((current) => (current - 1 + total) % total);
  }

  function goNext() {
    setSlide((current) => (current + 1) % total);
  }

  return (
    <section
      id={category.id}
      className="relative overflow-hidden rounded-3xl border border-gold/25 bg-black/50 p-4 shadow-2xl backdrop-blur-sm sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,205,104,0.12),transparent_50%)]" />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
          Category {index + 1}
        </p>
        <h2 className="mt-1 font-display text-2xl text-white sm:text-3xl">{category.title}</h2>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gold/20 bg-black/70">
          <video
            src={category.videoSrc}
            poster={category.imageSrcs[0]}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black object-contain"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-gold/20 bg-black/70">
          <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
            <Image
              src={category.imageSrcs[slide]}
              alt={`${category.title} nomination ${slide + 1}`}
              fill
              className="object-contain p-3 sm:p-4"
              sizes="(max-width: 768px) 100vw, 960px"
              priority={index === 0 && slide === 0}
            />
          </div>
          <div className="border-t border-white/10 bg-black/80 px-4 py-2.5">
            <p className="text-sm text-white/75">
              {slide + 1} of {total}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous nomination image"
            className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-semibold text-white transition hover:border-gold/50 hover:text-gold"
          >
            Previous
          </button>
          <div className="flex flex-wrap justify-center gap-2">
            {category.imageSrcs.map((src, dotIndex) => (
              <button
                key={src}
                type="button"
                aria-label={`Show image ${dotIndex + 1}`}
                onClick={() => setSlide(dotIndex)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  dotIndex === slide ? "bg-gold" : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next nomination image"
            className="rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-semibold text-white transition hover:border-gold/50 hover:text-gold"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
