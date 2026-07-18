"use client";

import { useCallback, useState } from "react";
import type { NomineeVoteTarget } from "@/lib/ticket-partner/resolve";
import { DAILY_VOTE_LIMIT, VOTING_BLAST_MESSAGE, VOTING_STARTS_MESSAGE } from "@/lib/voting";

type NomineeVoteSectionProps = {
  nomineeName: string;
  targets: NomineeVoteTarget[];
  votingOpen: boolean;
  openCategoryIds: string[];
  votesRemaining: number;
  votedCategoryIds: string[];
  unrestricted?: boolean;
};

export function NomineeVoteSection({
  nomineeName,
  targets,
  votingOpen,
  openCategoryIds,
  votesRemaining,
  votedCategoryIds,
  unrestricted = false,
}: NomineeVoteSectionProps) {
  const [votedCategories, setVotedCategories] = useState<Set<string>>(
    () => new Set(unrestricted ? [] : votedCategoryIds),
  );
  const [remaining, setRemaining] = useState(votesRemaining);
  const [justVotedCategory, setJustVotedCategory] = useState<string | null>(null);
  const openCategorySet = new Set(openCategoryIds);

  const handleVoted = useCallback(
    (categoryId: string, votesRemainingAfter: number) => {
      if (!unrestricted) {
        setVotedCategories((prev) => {
          const next = new Set(prev);
          next.add(categoryId);
          return next;
        });
      }
      setRemaining(votesRemainingAfter);
      setJustVotedCategory(categoryId);
    },
    [unrestricted],
  );

  if (targets.length === 0) return null;

  const limitReached = !unrestricted && votingOpen && remaining <= 0;

  return (
    <div id="vote" className="card-glow mx-auto max-w-lg scroll-mt-24 rounded-2xl bg-ink-deep/80 p-8 sm:p-10">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          {unrestricted ? "48hr voting blast" : "Cast your vote"}
        </p>
        <h2 className="mt-3 font-display text-2xl text-cream">Vote for {nomineeName}</h2>
        <p className="mt-3 text-sm text-cream/70">
          {!votingOpen ? (
            <>{VOTING_STARTS_MESSAGE}</>
          ) : unrestricted ? (
            <>{VOTING_BLAST_MESSAGE}</>
          ) : limitReached ? (
            <>You&apos;ve used all {DAILY_VOTE_LIMIT} of your votes for today. Come back tomorrow to vote again.</>
          ) : (
            <>
              You have <strong className="text-gold">{remaining}</strong> of {DAILY_VOTE_LIMIT} daily
              vote{remaining === 1 ? "" : "s"} left. You can vote once per category each day.
            </>
          )}
        </p>
      </div>

      <ul className="mt-8 space-y-3">
        {targets.map((target) => (
          <VoteRow
            key={target.pageEntryId}
            target={target}
            categoryVotingOpen={openCategorySet.has(target.categoryId)}
            alreadyVoted={!unrestricted && votedCategories.has(target.categoryId)}
            limitReached={limitReached}
            unrestricted={unrestricted}
            showThanks={justVotedCategory === target.categoryId}
            onVoted={handleVoted}
          />
        ))}
      </ul>
    </div>
  );
}

function VoteRow({
  target,
  categoryVotingOpen,
  alreadyVoted,
  limitReached,
  unrestricted,
  showThanks,
  onVoted,
}: {
  target: NomineeVoteTarget;
  categoryVotingOpen: boolean;
  alreadyVoted: boolean;
  limitReached: boolean;
  unrestricted: boolean;
  showThanks: boolean;
  onVoted: (categoryId: string, votesRemainingAfter: number) => void;
}) {
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  async function handleVote() {
    if (!categoryVotingOpen || voting || alreadyVoted || limitReached) return;
    setVoting(true);
    setError("");
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomineeId: target.nomineeId,
          pageEntryId: target.pageEntryId,
          categoryId: target.categoryId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        alreadyVoted?: boolean;
        votesRemaining?: number;
        error?: string;
      };

      if (res.ok && (data.success || data.alreadyVoted)) {
        onVoted(target.categoryId, data.votesRemaining ?? 0);
        return;
      }

      setError(data.error ?? "Could not record vote. Try again.");
    } catch {
      setError("Could not record vote. Try again.");
    } finally {
      setVoting(false);
    }
  }

  const disabled = !categoryVotingOpen || alreadyVoted || (limitReached && !alreadyVoted);

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-gold/15 bg-black/30 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-cream">{target.categoryTitle}</p>
        {error ? <p className="mt-0.5 text-xs text-red-300">{error}</p> : null}
        {unrestricted && showThanks && !error ? (
          <p className="mt-0.5 text-xs text-emerald-light">Vote counted — vote again anytime</p>
        ) : null}
      </div>

      {!categoryVotingOpen ? (
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={VOTING_STARTS_MESSAGE}
          className="shrink-0 cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/40"
        >
          Opens 9pm CT
        </button>
      ) : alreadyVoted ? (
        <span className="shrink-0 rounded-full border border-emerald/40 bg-emerald/15 px-4 py-2 text-sm font-semibold text-emerald-light">
          Voted today ✓
        </span>
      ) : (
        <button
          type="button"
          onClick={() => void handleVote()}
          disabled={disabled || voting}
          title={limitReached ? `Daily limit of ${DAILY_VOTE_LIMIT} votes reached` : undefined}
          className="shrink-0 rounded-full border border-gold/40 bg-gold/15 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/40"
        >
          {voting ? "Voting…" : unrestricted && showThanks ? "Vote again" : "Vote"}
        </button>
      )}
    </li>
  );
}
