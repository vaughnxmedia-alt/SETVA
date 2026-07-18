import { createHash, randomBytes } from "crypto";
import {
  createFormSubmission,
  FORM_TYPES,
  formStorageMode,
  listFormSubmissions,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";
import { DAILY_VOTE_LIMIT, voteDayKey, isVoteCountable, isVotingBlastActive } from "@/lib/voting";

export type NomineeVote = {
  id: string;
  nomineeId: string;
  pageEntryId: string;
  categoryId: string;
  voterKey: string;
  dayKey: string;
  votedAt: string;
};

type NomineeVotePayload = {
  nomineeId: string;
  pageEntryId: string;
  categoryId: string;
  voterKey: string;
  dayKey?: string;
};

function voterHash(voterKey: string): string {
  return createHash("sha256").update(voterKey).digest("hex").slice(0, 16);
}

/** One vote per category per voter per day, so the id is unique to that trio. */
function voteExternalId(categoryId: string, voterKey: string, dayKey: string): string {
  return `vote_${dayKey}_${categoryId}_${voterHash(voterKey)}`;
}

/** Unique id per cast so blast-mode repeat votes are not blocked by external_id uniqueness. */
function blastVoteExternalId(categoryId: string, voterKey: string): string {
  return `vote_blast_${Date.now()}_${categoryId}_${voterHash(voterKey)}_${randomBytes(4).toString("hex")}`;
}

function voteFromRecord(record: FormSubmissionRecord): NomineeVote {
  const payload = record.payload as NomineeVotePayload;
  return {
    id: record.external_id ?? record.id,
    nomineeId: payload.nomineeId,
    pageEntryId: payload.pageEntryId,
    categoryId: payload.categoryId,
    voterKey: payload.voterKey,
    dayKey: payload.dayKey ?? voteDayKey(new Date(record.submitted_at)),
    votedAt: record.submitted_at,
  };
}

export type RecordVoteResult = {
  recorded: boolean;
  /** Voter already voted in this category during the current day. */
  alreadyVoted: boolean;
  /** Voter has hit the per-day vote cap across categories. */
  limitReached: boolean;
  votesRemaining: number;
  unrestricted: boolean;
};

export async function recordNomineeVote(input: {
  nomineeId: string;
  pageEntryId: string;
  categoryId: string;
  voterKey: string;
}): Promise<RecordVoteResult> {
  const unrestricted = isVotingBlastActive();

  if (formStorageMode() !== "supabase") {
    return {
      recorded: false,
      alreadyVoted: false,
      limitReached: false,
      votesRemaining: unrestricted ? Number.MAX_SAFE_INTEGER : DAILY_VOTE_LIMIT,
      unrestricted,
    };
  }

  const dayKey = voteDayKey();
  const externalId = unrestricted
    ? blastVoteExternalId(input.categoryId, input.voterKey)
    : voteExternalId(input.categoryId, input.voterKey, dayKey);

  let todaysVoteCount = 0;

  if (!unrestricted) {
    const votes = await listNomineeVotes();
    const todaysVotes = votes.filter((vote) => vote.voterKey === input.voterKey && vote.dayKey === dayKey);
    todaysVoteCount = todaysVotes.length;
    const votedInCategory = todaysVotes.some((vote) => vote.categoryId === input.categoryId);

    if (votedInCategory) {
      return {
        recorded: false,
        alreadyVoted: true,
        limitReached: false,
        votesRemaining: Math.max(0, DAILY_VOTE_LIMIT - todaysVoteCount),
        unrestricted: false,
      };
    }

    if (todaysVoteCount >= DAILY_VOTE_LIMIT) {
      return {
        recorded: false,
        alreadyVoted: false,
        limitReached: true,
        votesRemaining: 0,
        unrestricted: false,
      };
    }
  }

  const payload: NomineeVotePayload = {
    nomineeId: input.nomineeId,
    pageEntryId: input.pageEntryId,
    categoryId: input.categoryId,
    voterKey: input.voterKey,
    dayKey,
  };

  const record = await createFormSubmission({
    externalId,
    formType: FORM_TYPES.nomineeVotes,
    status: "recorded",
    payload,
  });

  const recorded = Boolean(record);

  return {
    recorded,
    alreadyVoted: false,
    limitReached: false,
    votesRemaining: unrestricted
      ? Number.MAX_SAFE_INTEGER
      : Math.max(0, DAILY_VOTE_LIMIT - todaysVoteCount - (recorded ? 1 : 0)),
    unrestricted,
  };
}

export type VoterDailyStatus = {
  votesToday: number;
  votesRemaining: number;
  votedCategoryIds: string[];
  unrestricted: boolean;
};

/** Current-day voting status for a voter: how many votes used and which categories. */
export async function getVoterDailyStatus(voterKey: string): Promise<VoterDailyStatus> {
  const unrestricted = isVotingBlastActive();

  if (!voterKey || formStorageMode() !== "supabase") {
    return {
      votesToday: 0,
      votesRemaining: unrestricted ? Number.MAX_SAFE_INTEGER : DAILY_VOTE_LIMIT,
      votedCategoryIds: [],
      unrestricted,
    };
  }

  if (unrestricted) {
    return {
      votesToday: 0,
      votesRemaining: Number.MAX_SAFE_INTEGER,
      votedCategoryIds: [],
      unrestricted: true,
    };
  }

  const dayKey = voteDayKey();
  const votes = await listNomineeVotes();
  const todaysVotes = votes.filter((vote) => vote.voterKey === voterKey && vote.dayKey === dayKey);

  return {
    votesToday: todaysVotes.length,
    votesRemaining: Math.max(0, DAILY_VOTE_LIMIT - todaysVotes.length),
    votedCategoryIds: [...new Set(todaysVotes.map((vote) => vote.categoryId))],
    unrestricted: false,
  };
}

export async function listNomineeVotes(): Promise<NomineeVote[]> {
  if (formStorageMode() !== "supabase") return [];
  const records = await listFormSubmissions(FORM_TYPES.nomineeVotes);
  return records
    .map(voteFromRecord)
    .sort((a, b) => new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime());
}

export async function getNomineeVoteTallies(): Promise<Record<string, number>> {
  const votes = await listNomineeVotes();
  const tallies: Record<string, number> = {};

  for (const vote of votes) {
    if (!isVoteCountable(vote)) continue;
    tallies[vote.nomineeId] = (tallies[vote.nomineeId] ?? 0) + 1;
  }

  return tallies;
}

export function createVoterKey(): string {
  return `voter_${Date.now()}_${randomBytes(8).toString("hex")}`;
}

export type HQVotingNomineeRow = {
  nomineeId: string;
  nomineeName: string;
  categoryId: string;
  categoryTitle: string;
  graphicUrl: string;
  voteCount: number;
  categoryPercent: number;
};

export type HQVotingCategorySection = {
  categoryId: string;
  categoryTitle: string;
  totalVotes: number;
  nominees: HQVotingNomineeRow[];
};
