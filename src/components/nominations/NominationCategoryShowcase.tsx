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
  const firstGraphic = category.nominees.find((nominee) => nominee.hasGraphic);
  // Only use the full image-card grid when every nominee in the category has a
  // graphic. If any are missing, present the whole category uniformly as
  // calling-card name tags (graphics, when present, show as the card avatar).
  const allHaveGraphics =
    category.nominees.length > 0 && category.nominees.every((nominee) => nominee.hasGraphic);

  return (
    <section
      id={category.id}
      className="relative overflow-hidden rounded-3xl border border-gold/25 bg-black/50 p-4 shadow-2xl backdrop-blur-sm sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,205,104,0.12),transparent_50%)]" />

      <div className="relative min-w-0">
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
              poster={category.videoPoster || firstGraphic?.imageSrc || undefined}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black object-contain"
            />
          </div>
        ) : null}

        {allHaveGraphics ? (
          <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        ) : (
          <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {category.nominees.map((nominee) => (
              <NomineeNameCard
                key={nominee.id}
                nominee={nominee}
                votingOpen={votingOpen}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TorchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {/* flame */}
      <path d="M12 2c-.7 1.4-1.9 2.3-2.7 3.6-.7 1-1.1 2.1-1.1 3.3a3.8 3.8 0 0 0 7.6 0c0-1.3-.5-2.4-1.4-3.4.3.6.4 1.2.4 1.8a2 2 0 0 1-4 0c0-1 .4-1.8 1-2.6C11 4.9 11.6 3.5 12 2z" />
      {/* torch cup */}
      <path d="M8.6 12.3h6.8l-1 2.2H9.6z" />
      {/* handle */}
      <path d="M10.9 15h2.2l-.5 6.4a.6.6 0 0 1-1.2 0z" />
    </svg>
  );
}

function NomineeNameCard({
  nominee,
  votingOpen,
}: {
  nominee: PublicNomineePageCategory["nominees"][number];
  votingOpen: boolean;
}) {
  const votingLocked = !votingOpen;

  return (
    <a
      href={nominee.ticketHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        votingLocked
          ? `${nominee.nomineeName} — ${VOTING_STARTS_MESSAGE}`
          : `Support and vote for ${nominee.nomineeName}`
      }
      className={`group flex w-full min-w-0 max-w-full items-center gap-3 rounded-2xl border bg-gradient-to-br from-black/80 to-black/50 p-3 transition sm:gap-4 sm:p-4 ${
        votingLocked ? "border-white/10" : "border-gold/25 hover:border-gold/50"
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold sm:h-14 sm:w-14">
        <TorchIcon className="h-6 w-6 sm:h-7 sm:w-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words font-display text-base leading-snug text-white sm:text-lg">
          {nominee.nomineeName}
        </span>
        <span className="mt-1 block text-xs text-white/55">
          {votingLocked ? VOTING_STARTS_MESSAGE : "Vote now →"}
        </span>
      </span>
    </a>
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
