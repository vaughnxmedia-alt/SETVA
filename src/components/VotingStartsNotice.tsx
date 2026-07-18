import {
  getVotingLiveMessage,
  isPublicVotingOpen,
  isVotingBlastActive,
  VOTING_STARTS_MESSAGE,
} from "@/lib/voting";

type VotingStartsNoticeProps = {
  className?: string;
  /** When true, always render the notice (e.g. on ticket partner pages before voting opens). */
  forceShow?: boolean;
};

export function VotingStartsNotice({ className = "", forceShow = false }: VotingStartsNoticeProps) {
  const blastActive = isVotingBlastActive();

  if (!forceShow && isPublicVotingOpen() && !blastActive) return null;

  const message = blastActive ? getVotingLiveMessage() : VOTING_STARTS_MESSAGE;

  return (
    <p
      role="status"
      className={`rounded-2xl border border-gold/30 bg-gold/10 px-5 py-4 text-center text-sm font-medium text-gold sm:text-base ${className}`}
    >
      {message}
    </p>
  );
}
