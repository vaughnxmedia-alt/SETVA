"use client";

import { useEffect, useState } from "react";
import {
  isPublicVotingOpen,
  publicVotingOpensAtMs,
  VOTING_LIVE_MESSAGE,
  VOTING_STARTS_MESSAGE,
} from "@/lib/voting";

type TimeLeft = {
  hours: number;
  minutes: number;
  seconds: number;
};

type VotingCountdownClockProps = {
  className?: string;
  onVotingOpen?: () => void;
};

function getTimeLeft(targetMs: number, now = Date.now()): TimeLeft | null {
  const diff = targetMs - now;
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function GoldHourglass({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 64"
      aria-hidden
      className={`voting-hourglass h-14 w-10 shrink-0 text-gold ${className}`}
      fill="none"
    >
      <path
        d="M8 4h32l-12 20v8l12 20H8l12-20v-8L8 4Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <path
        d="M20 28h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        className="voting-hourglass-sand-top"
        d="M14 10h20L24 22H14v-2l8-8H14v-2Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        className="voting-hourglass-sand-bottom"
        d="M14 54h20l-10-12H24l-10 12Z"
        fill="currentColor"
        opacity="0.85"
      />
      <circle className="voting-hourglass-grain" cx="24" cy="31" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function VotingCountdownClock({ className = "", onVotingOpen }: VotingCountdownClockProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => {
    if (isPublicVotingOpen()) return null;
    return getTimeLeft(publicVotingOpensAtMs());
  });

  useEffect(() => {
    if (isPublicVotingOpen()) {
      setTimeLeft(null);
      onVotingOpen?.();
      return;
    }

    const target = publicVotingOpensAtMs();

    function tick() {
      const next = getTimeLeft(target);
      if (next === null) {
        onVotingOpen?.();
      }
      setTimeLeft(next);
    }

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [onVotingOpen]);

  if (timeLeft === null) return null;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`${VOTING_STARTS_MESSAGE} Countdown: ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds.`}
      className={`rounded-2xl border border-gold/30 bg-gold/10 px-5 py-5 sm:px-6 sm:py-6 ${className}`}
    >
      <div className="flex flex-col items-center gap-4">
        <GoldHourglass />
        <div className="flex items-end justify-center gap-2 sm:gap-3">
          <TimeUnit value={timeLeft.hours} label="Hrs" />
          <span className="mb-5 font-display text-2xl font-semibold text-gold sm:text-3xl">:</span>
          <TimeUnit value={timeLeft.minutes} label="Min" />
          <span className="mb-5 font-display text-2xl font-semibold text-gold sm:text-3xl">:</span>
          <TimeUnit value={timeLeft.seconds} label="Sec" tickKey={timeLeft.seconds} />
        </div>
        <p className="text-sm font-medium text-gold/90 sm:text-base">{VOTING_STARTS_MESSAGE}</p>
        <p className="sr-only">{VOTING_LIVE_MESSAGE}</p>
      </div>
    </div>
  );
}

function TimeUnit({
  value,
  label,
  tickKey,
}: {
  value: number;
  label: string;
  tickKey?: number;
}) {
  return (
    <div className="flex min-w-[4.25rem] flex-col items-center sm:min-w-[4.75rem]">
      <span
        key={tickKey}
        className={`font-display text-4xl font-semibold tabular-nums tracking-tight text-gold sm:text-5xl ${
          tickKey !== undefined ? "voting-countdown-tick" : ""
        }`}
      >
        {pad(value)}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/70">
        {label}
      </span>
    </div>
  );
}
