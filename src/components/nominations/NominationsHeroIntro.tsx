import Image from "next/image";
import { VotingCountdownClock } from "@/components/nominations/VotingCountdownClock";
import { site } from "@/lib/site";
import { VOTING_LIVE_MESSAGE } from "@/lib/voting";

type NominationsHeroIntroProps = {
  votingOpen: boolean;
  onVotingOpen: () => void;
};

export function NominationsHeroIntro({ votingOpen, onVotingOpen }: NominationsHeroIntroProps) {
  return (
    <header className="mx-auto max-w-2xl text-center">
      <div className="mx-auto w-full max-w-lg">
        <Image
          src="/setva-2026-nominations-header-transparent.png"
          alt={`${site.fullName} 2026`}
          width={1024}
          height={576}
          className="mx-auto h-auto w-full"
          priority
        />
      </div>
      <h1 className="mt-4 font-display text-4xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:text-5xl">
        Nominations
      </h1>
      <p className="mt-4 font-display text-lg italic leading-relaxed text-white/90 sm:text-xl">
        Celebrating visionary talent across the 409 — choose a category to browse nominees.
      </p>
      {votingOpen ? (
        <p
          role="status"
          className="mt-6 rounded-2xl border border-emerald/30 bg-emerald/10 px-5 py-4 text-center text-sm font-medium text-emerald-light sm:text-base"
        >
          {VOTING_LIVE_MESSAGE}
        </p>
      ) : (
        <VotingCountdownClock className="mt-6" onVotingOpen={onVotingOpen} />
      )}
    </header>
  );
}
