"use client";

import Image from "next/image";
import type { PublicNomineePageCategory } from "@/lib/nominees";
import { VOTING_STARTS_MESSAGE } from "@/lib/voting";

type NominationCategoryShowcaseProps = {
  category: PublicNomineePageCategory;
  index: number;
  votingOpen: boolean;
};

export function NominationCategoryShowcase({
  category,
  index,
  votingOpen,
}: NominationCategoryShowcaseProps) {
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
        <p className="mt-2 text-sm text-white/60">
          {category.nominees.length} nominee{category.nominees.length === 1 ? "" : "s"}
        </p>

        {category.videoSrc ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-gold/20 bg-black/70">
            <video
              src={category.videoSrc}
              poster={category.videoPoster || category.nominees[0]?.imageSrc}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black object-contain"
            />
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {category.nominees.map((nominee, nomineeIndex) => (
            <NomineeCard
              key={nominee.id}
              nominee={nominee}
              categoryTitle={category.title}
              priority={index === 0 && nomineeIndex === 0}
              votingOpen={votingOpen}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function NomineeCard({
  nominee,
  categoryTitle,
  priority,
  votingOpen,
}: {
  nominee: PublicNomineePageCategory["nominees"][number];
  categoryTitle: string;
  priority: boolean;
  votingOpen: boolean;
}) {
  const votingLocked = !votingOpen;

  return (
    <figure
      className={`group overflow-hidden rounded-2xl border bg-black/70 transition ${
        votingLocked ? "border-white/10" : "border-gold/20 hover:border-gold/45"
      }`}
    >
      <a
        href={nominee.ticketHref}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        aria-label={
          votingLocked
            ? `${nominee.nomineeName} — ${VOTING_STARTS_MESSAGE}`
            : `Support and vote for ${nominee.nomineeName}`
        }
      >
        <div className="relative aspect-[4/5] w-full">
          <Image
            src={nominee.imageSrc}
            alt={`${nominee.nomineeName} — ${categoryTitle}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            priority={priority}
          />
        </div>
        <figcaption className="border-t border-white/10 bg-black/80 px-4 py-3">
          <p className="font-display text-lg text-white">{nominee.nomineeName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gold/80">{categoryTitle}</p>
          <p className="mt-2 text-xs text-white/55">
            {votingLocked ? VOTING_STARTS_MESSAGE : "Vote now →"}
          </p>
        </figcaption>
      </a>
    </figure>
  );
}
