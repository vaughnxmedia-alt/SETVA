"use client";

import { useCallback, useState } from "react";
import type { NomineeVoteTarget } from "@/lib/ticket-partner/resolve";
import { DAILY_VOTE_LIMIT, VOTING_OPENS_LABEL } from "@/lib/voting";

type NomineeVoteSectionProps = {
  nomineeName: string;
  targets: NomineeVoteTarget[];
  votingOpen: boolean;
  votesRemaining: number;
  votedCategoryIds: string[];
};

export function NomineeVoteSection({
  nomineeName,
  targets,
  votingOpen,
  votesRemaining,
  votedCategoryIds,
}: NomineeVoteSectionProps) {
  const [votedCategories, setVotedCategories] = useState<Set<string>>(
    () => new Set(votedCategoryIds),
  );
  const [remaining, setRemaining] = useState(votesRemaining);

  const handleVoted = useCallback((categoryId: string, votesRemainingAfter: number) => {
    setVotedCategories((prev) => {
      const next = new Set(prev);
      next.add(categoryId);
      return next;
    });
    setRemaining(votesRemainingAfter);
  }, []);

  if (targets.length === 0) return null;

  const limitReached = votingOpen && remaining <= 0;

  return (
    <div className="card-glow mx-auto mt-6 max-w-lg rounded-2xl bg-ink-deep/80 p-8 sm:p-10">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Cast your vote</p>
        <h2 className="mt-3 font-display text-2xl text-cream">Vote for {nomineeName}</h2>
        <p className="mt-3 text-sm text-cream/70">
          {!votingOpen ? (
            <>Voting opens {VOTING_OPENS_LABEL}. Check back then to vote in each category below.</>
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
            votingOpen={votingOpen}
            alreadyVoted={votedCategories.has(target.categoryId)}
            limitReached={limitReached}
            onVoted={handleVoted}
          />
        ))}
      </ul>
    </div>
  );
}

function VoteRow({
  target,
  votingOpen,
  alreadyVoted,
  limitReached,
  onVoted,
}: {
  target: NomineeVoteTarget;
  votingOpen: boolean;
  alreadyVoted: boolean;
  limitReached: boolean;
  onVoted: (categoryId: string, votesRemainingAfter: number) => void;
}) {
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  async function handleVote() {
    if (!votingOpen || voting || alreadyVoted || limitReached) return;
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

  const disabled = !votingOpen || alreadyVoted || (limitReached && !alreadyVoted);

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border border-gold/15 bg-black/30 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-cream">{target.categoryTitle}</p>
        {error ? <p className="mt-0.5 text-xs text-red-300">{error}</p> : null}
      </div>

      {!votingOpen ? (
        <button
          type="button"
          disabled
          aria-disabled="true"
          title={`Voting opens ${VOTING_OPENS_LABEL}`}
          className="shrink-0 cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/40"
        >
          Opens {VOTING_OPENS_LABEL}
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
          {voting ? "Voting…" : "Vote"}
        </button>
      )}
    </li>
  );
}
