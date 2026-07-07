import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TicketPartnerGateForm } from "@/components/tickets/TicketPartnerGateForm";
import { NomineeVoteSection } from "@/components/tickets/NomineeVoteSection";
import { VotingStartsNotice } from "@/components/VotingStartsNotice";
import { recordTicketLinkEvent } from "@/lib/ticket-link-events-store";
import { createPageMetadata } from "@/lib/metadata";
import { listNomineeVoteTargets, resolveTicketPartnerBySlug } from "@/lib/ticket-partner/resolve";
import { getVoterDailyStatus } from "@/lib/votes-store";
import {
  DAILY_VOTE_LIMIT,
  isPublicVotingOpen,
  VOTER_COOKIE,
} from "@/lib/voting";

// Voting availability and published categories must reflect live data.
export const dynamic = "force-dynamic";

type TicketPartnerGatePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TicketPartnerGatePageProps) {
  const { slug } = await params;
  const partner = await resolveTicketPartnerBySlug(slug);
  return createPageMetadata({
    title: partner ? `Tickets via ${partner.sourceName}` : "Ticket partner link",
    description: "Enter your name, email, and phone to continue to Ticketmaster through a SETVA ticket partner link.",
    path: `/go/tickets/${slug}`,
  });
}

export default async function TicketPartnerGatePage({ params }: TicketPartnerGatePageProps) {
  const { slug } = await params;
  const partner = await resolveTicketPartnerBySlug(slug);

  if (!partner) {
    redirect("/tickets");
  }

  await recordTicketLinkEvent({
    slug: partner.slug,
    sourceType: partner.sourceType,
    sourceId: partner.sourceId,
    sourceName: partner.sourceName,
    eventType: "click",
  });

  const isNominee = partner.sourceType === "nominee";

  const voteTargets = isNominee ? await listNomineeVoteTargets(partner.sourceName) : [];
  const votingOpen = isPublicVotingOpen() && voteTargets.length > 0;
  const openCategoryIds = votingOpen ? voteTargets.map((target) => target.categoryId) : [];

  const voterKey = (await cookies()).get(VOTER_COOKIE)?.value?.trim() ?? "";
  const dailyStatus =
    votingOpen && voterKey
      ? await getVoterDailyStatus(voterKey)
      : { votesToday: 0, votesRemaining: DAILY_VOTE_LIMIT, votedCategoryIds: [] };

  const showVoteSection = isNominee && voteTargets.length > 0;

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <VotingStartsNotice className="mx-auto mb-6 max-w-lg" />
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        {showVoteSection && votingOpen ? (
          <NomineeVoteSection
            nomineeName={partner.sourceName}
            targets={voteTargets}
            votingOpen={votingOpen}
            openCategoryIds={openCategoryIds}
            votesRemaining={dailyStatus.votesRemaining}
            votedCategoryIds={dailyStatus.votedCategoryIds}
          />
        ) : null}
        <TicketPartnerGateForm partner={partner} />
        {showVoteSection && !votingOpen ? (
          <NomineeVoteSection
            nomineeName={partner.sourceName}
            targets={voteTargets}
            votingOpen={votingOpen}
            openCategoryIds={openCategoryIds}
            votesRemaining={dailyStatus.votesRemaining}
            votedCategoryIds={dailyStatus.votedCategoryIds}
          />
        ) : null}
      </div>
    </div>
  );
}
