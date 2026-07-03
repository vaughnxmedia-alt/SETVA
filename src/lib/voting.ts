/** Voting opens July 6, 2026 at midnight Central (CDT, UTC-5). */
export const VOTING_OPENS_AT = "2026-07-06T00:00:00-05:00";

export const VOTING_OPENS_LABEL = "July 6, 2026";

export const VOTER_COOKIE = "setva_voter";

export const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Each voter may cast up to 3 votes per day, and at most 1 per category per day. */
export const DAILY_VOTE_LIMIT = 3;

/** Vote-day buckets follow the calendar day in Central time and reset at midnight. */
const VOTE_TIMEZONE = "America/Chicago";

export function isVotingOpen(now = Date.now()): boolean {
  return now >= Date.parse(VOTING_OPENS_AT);
}

export function votingOpensAtIso(): string {
  return VOTING_OPENS_AT;
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
