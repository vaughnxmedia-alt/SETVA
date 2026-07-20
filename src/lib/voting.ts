import type { NomineeVotingSetup } from "@/lib/nominees";
import { listNomineePageEntries, listNomineeVotingSetups } from "@/lib/nominee-workflows-store";

export const VOTER_COOKIE = "setva_voter";

export const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Each voter may cast up to 3 votes per day, and at most 1 per category per day (when blast is off). */
export const DAILY_VOTE_LIMIT = 3;

/** Vote-day buckets follow the calendar day in Central time and reset at midnight. */
const VOTE_TIMEZONE = "America/Chicago";

/** SETVA 2026 public voting opens July 6, 2026 at 9:00 PM Central (CDT). */
export const PUBLIC_VOTING_OPENS_AT = "2026-07-06T21:00:00-05:00";

/**
 * 48hr voting blast — unrestricted voting window.
 * Opens Sat Jul 18, 2026 10:00 AM CT; closes Mon Jul 20, 2026 11:59 PM CT.
 */
export const VOTING_BLAST_OPENS_AT = "2026-07-18T10:00:00-05:00";
export const VOTING_BLAST_CLOSES_AT = "2026-07-21T00:00:00-05:00";

/** Shown across the public site while voting is locked. */
export const VOTING_STARTS_MESSAGE = "Voting starts today at 9pm Central Time.";

/** Default live copy when the blast window is not active. */
export const VOTING_LIVE_MESSAGE_DEFAULT = "Voting is live — cast your vote below.";

/** Shown during the unrestricted 48hr voting blast. */
export const VOTING_BLAST_MESSAGE =
  "48hr voting blast — vote as many times as you want.";

/** Live voting message (blast-aware at module load; prefer getVotingLiveMessage() when possible). */
export const VOTING_LIVE_MESSAGE = VOTING_BLAST_MESSAGE;

const votingLabelFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: VOTE_TIMEZONE,
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function publicVotingOpensAtMs(): number {
  return Date.parse(PUBLIC_VOTING_OPENS_AT);
}

export function votingBlastOpensAtMs(): number {
  return Date.parse(VOTING_BLAST_OPENS_AT);
}

export function votingBlastClosesAtMs(): number {
  return Date.parse(VOTING_BLAST_CLOSES_AT);
}

/** True during the unrestricted 48hr voting blast window. */
export function isVotingBlastActive(now = Date.now()): boolean {
  return now >= votingBlastOpensAtMs() && now < votingBlastClosesAtMs();
}

export function getVotingLiveMessage(now = Date.now()): string {
  return isVotingBlastActive(now) ? VOTING_BLAST_MESSAGE : VOTING_LIVE_MESSAGE_DEFAULT;
}

/** True once the public voting launch time has passed. */
export function isPublicVotingOpen(now = Date.now()): boolean {
  return now >= publicVotingOpensAtMs();
}

export function votingWindowForSetup(setup: NomineeVotingSetup): {
  open: number;
  close: number;
} {
  return {
    open: setup.votingOpenDate ? Date.parse(setup.votingOpenDate) : Number.NaN,
    close: setup.votingCloseDate ? Date.parse(setup.votingCloseDate) : Number.POSITIVE_INFINITY,
  };
}

function isPublishedPageEntry(
  entry: Awaited<ReturnType<typeof listNomineePageEntries>>[number],
  input: { categoryId: string; nomineeId: string; pageEntryId?: string },
): boolean {
  if (!entry.publishToNomineePage || entry.status !== "Published") return false;
  if (entry.categoryId !== input.categoryId || entry.nomineeId !== input.nomineeId) return false;
  if (input.pageEntryId && entry.id !== input.pageEntryId) return false;
  return true;
}

/** Categories with at least one published nominee on the public nominations page. */
export async function listPublishedVoteCategoryIds(now = Date.now()): Promise<string[]> {
  if (!isPublicVotingOpen(now)) return [];

  const entries = await listNomineePageEntries();
  const categoryIds = new Set<string>();

  for (const entry of entries) {
    if (entry.publishToNomineePage && entry.status === "Published") {
      categoryIds.add(entry.categoryId);
    }
  }

  return [...categoryIds];
}

/** True when public voting is live and at least one nominee is published for voting. */
export async function isVotingOpen(now = Date.now()): Promise<boolean> {
  if (!isPublicVotingOpen(now)) return false;
  const categories = await listPublishedVoteCategoryIds(now);
  return categories.length > 0;
}

export async function isCategoryVotingOpen(
  categoryId: string,
  now = Date.now(),
): Promise<boolean> {
  if (!isPublicVotingOpen(now)) return false;
  const categoryIds = await listPublishedVoteCategoryIds(now);
  return categoryIds.includes(categoryId);
}

export async function canRecordVote(input: {
  categoryId: string;
  nomineeId: string;
  pageEntryId?: string;
  now?: number;
}): Promise<boolean> {
  const now = input.now ?? Date.now();
  if (!isPublicVotingOpen(now)) return false;

  const entries = await listNomineePageEntries();
  return entries.some((entry) => isPublishedPageEntry(entry, input));
}

/** Count votes cast on or after the public voting launch. */
export function isVoteCountable(vote: { votedAt: string }, now = Date.now()): boolean {
  if (!isPublicVotingOpen(now)) return false;

  const votedAt = Date.parse(vote.votedAt);
  return Number.isFinite(votedAt) && votedAt >= publicVotingOpensAtMs();
}

export async function getVotingOpensLabel(now = Date.now()): Promise<string> {
  if (!isPublicVotingOpen(now)) {
    return VOTING_STARTS_MESSAGE;
  }

  if (await isVotingOpen(now)) {
    return getVotingLiveMessage(now);
  }

  const published = (await listNomineeVotingSetups()).filter(
    (setup) => setup.votingStatus === "Published",
  );

  if (published.length === 0) {
    return getVotingLiveMessage(now);
  }

  const futureOpens = published
    .map((setup) => Date.parse(setup.votingOpenDate))
    .filter((value) => Number.isFinite(value) && value > now)
    .sort((a, b) => a - b);

  if (futureOpens.length > 0) {
    return votingLabelFormatter.format(new Date(futureOpens[0]));
  }

  return getVotingLiveMessage(now);
}

/** Returns the current vote day as YYYY-MM-DD in Central time (the daily-limit bucket). */
export function voteDayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VOTE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
