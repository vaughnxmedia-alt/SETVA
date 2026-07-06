import type { NomineeVotingSetup } from "@/lib/nominees";
import { listNomineeVotingSetups } from "@/lib/nominee-workflows-store";

export const VOTER_COOKIE = "setva_voter";

export const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Each voter may cast up to 3 votes per day, and at most 1 per category per day. */
export const DAILY_VOTE_LIMIT = 3;

/** Vote-day buckets follow the calendar day in Central time and reset at midnight. */
const VOTE_TIMEZONE = "America/Chicago";

/** SETVA 2026 public voting opens July 6, 2026 at 9:00 PM Central (CDT). */
export const PUBLIC_VOTING_OPENS_AT = "2026-07-06T21:00:00-05:00";

/** Shown across the public site while voting is locked. */
export const VOTING_STARTS_MESSAGE = "Voting starts today at 9pm Central Time.";

const votingLabelFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: VOTE_TIMEZONE,
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function publicVotingOpensAtMs(): number {
  return Date.parse(PUBLIC_VOTING_OPENS_AT);
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

export function isSetupVotingOpen(setup: NomineeVotingSetup, now = Date.now()): boolean {
  if (!isPublicVotingOpen(now)) return false;
  if (setup.votingStatus !== "Published") return false;
  const { open, close } = votingWindowForSetup(setup);
  if (!Number.isFinite(open)) return false;
  return now >= open && now <= close;
}

export async function listCurrentlyOpenVotingSetups(
  now = Date.now(),
): Promise<NomineeVotingSetup[]> {
  if (!isPublicVotingOpen(now)) return [];
  const setups = await listNomineeVotingSetups();
  return setups.filter((setup) => isSetupVotingOpen(setup, now));
}

/** True when at least one published Headquarters voting window is currently open. */
export async function isVotingOpen(now = Date.now()): Promise<boolean> {
  const openSetups = await listCurrentlyOpenVotingSetups(now);
  return openSetups.length > 0;
}

export async function isCategoryVotingOpen(
  categoryId: string,
  now = Date.now(),
): Promise<boolean> {
  if (!isPublicVotingOpen(now)) return false;
  const setups = await listNomineeVotingSetups();
  return setups.some(
    (setup) => setup.categoryId === categoryId && isSetupVotingOpen(setup, now),
  );
}

export async function canRecordVote(input: {
  categoryId: string;
  nomineeId: string;
  now?: number;
}): Promise<boolean> {
  const now = input.now ?? Date.now();
  if (!isPublicVotingOpen(now)) return false;
  const setups = await listNomineeVotingSetups();
  return setups.some(
    (setup) =>
      setup.categoryId === input.categoryId &&
      setup.nomineeIds.includes(input.nomineeId) &&
      isSetupVotingOpen(setup, now),
  );
}

export function isVoteInPublishedWindow(
  vote: { categoryId: string; nomineeId: string; votedAt: string },
  setups: NomineeVotingSetup[],
): boolean {
  const votedAt = Date.parse(vote.votedAt);
  if (!Number.isFinite(votedAt) || votedAt < publicVotingOpensAtMs()) return false;

  const setup = setups.find(
    (item) => item.votingStatus === "Published" && item.categoryId === vote.categoryId,
  );
  if (!setup || !setup.nomineeIds.includes(vote.nomineeId)) return false;

  const { open, close } = votingWindowForSetup(setup);
  if (!Number.isFinite(open)) return false;

  return votedAt >= open && votedAt <= close;
}

export async function getVotingOpensLabel(now = Date.now()): Promise<string> {
  if (!isPublicVotingOpen(now)) {
    return VOTING_STARTS_MESSAGE;
  }

  const published = (await listNomineeVotingSetups()).filter(
    (setup) => setup.votingStatus === "Published",
  );

  if (published.length === 0) {
    return "when voting is scheduled in Headquarters";
  }

  const futureOpens = published
    .map((setup) => Date.parse(setup.votingOpenDate))
    .filter((value) => Number.isFinite(value) && value > now)
    .sort((a, b) => a - b);

  if (futureOpens.length > 0) {
    return votingLabelFormatter.format(new Date(futureOpens[0]));
  }

  if (published.some((setup) => isSetupVotingOpen(setup, now))) {
    return "now";
  }

  return "when the next voting window opens";
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
