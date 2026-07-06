"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicNomineePageCategory } from "@/lib/nominees";
import { NominationsBrowse } from "@/components/nominations/NominationsBrowse";
import { NominationsHeroIntro } from "@/components/nominations/NominationsHeroIntro";
import { isPublicVotingOpen } from "@/lib/voting";

type NominationsLiveVotingProps = {
  categories: PublicNomineePageCategory[];
  initialVotingOpen: boolean;
};

export function NominationsLiveVoting({
  categories,
  initialVotingOpen,
}: NominationsLiveVotingProps) {
  const [votingOpen, setVotingOpen] = useState(initialVotingOpen);
  const handleVotingOpen = useCallback(() => setVotingOpen(true), []);

  useEffect(() => {
    if (votingOpen) return;

    const interval = window.setInterval(() => {
      if (isPublicVotingOpen()) {
        setVotingOpen(true);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [votingOpen]);

  return (
    <>
      <NominationsHeroIntro votingOpen={votingOpen} onVotingOpen={handleVotingOpen} />

      {categories.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-gold/25 bg-black/50 p-6 text-center text-white/70 shadow-2xl backdrop-blur-sm">
          Nominees will appear here when SETVA publishes them.
        </div>
      ) : (
        <NominationsBrowse categories={categories} votingOpen={votingOpen} />
      )}
    </>
  );
}
