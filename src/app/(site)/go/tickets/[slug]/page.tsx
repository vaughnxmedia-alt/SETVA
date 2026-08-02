import { cookies } from "next/headers";
import { TicketPartnerGateForm } from "@/components/tickets/TicketPartnerGateForm";
import { NomineeVoteSection } from "@/components/tickets/NomineeVoteSection";
import { VotingStartsNotice } from "@/components/VotingStartsNotice";
import { recordTicketLinkEvent } from "@/lib/ticket-link-events-store";
import { createPageMetadata } from "@/lib/metadata";
import { ticketmasterDestination, ticketPartnerTrackingUrl } from "@/lib/ticket-partner/links";
import { listNomineeVoteTargets, resolveTicketPartnerBySlug } from "@/lib/ticket-partner/resolve";
import { getVoterDailyStatus } from "@/lib/votes-store";
import {
  DAILY_VOTE_LIMIT,
  isPublicVotingOpen,
  isVotingBlastActive,
  VOTER_COOKIE,
} from "@/lib/voting";

// Voting availability and published categories must reflect live data.
export const dynamic = "force-dynamic";

type TicketPartnerGatePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: TicketPartnerGatePageProps) {
  const { slug } = await params;
  const partner = await resolveTicketPartnerBySlug(slug).catch(() => null);
  return createPageMetadata({
    title: partner ? `Tickets via ${partner.sourceName}` : "Ticket partner link",
    description: "Enter your name, email, and phone to continue to Ticketmaster through a SETVA ticket partner link.",
    path: `/go/tickets/${slug}`,
  });
}

export default async function TicketPartnerGatePage({ params }: TicketPartnerGatePageProps) {
  const { slug } = await params;

  // A shared link must reach Ticketmaster even when the partner cannot be
  // looked up, so lookup problems downgrade attribution instead of the sale.
  const partner = await resolveTicketPartnerBySlug(slug).catch(() => null);

  if (partner) {
    await recordTicketLinkEvent({
      slug: partner.slug,
      sourceType: partner.sourceType,
      sourceId: partner.sourceId,
      sourceName: partner.sourceName,
      eventType: "click",
    }).catch(() => undefined);
  }

  const isNominee = partner?.sourceType === "nominee";

  const voteTargets =
    isNominee && partner
      ? await listNomineeVoteTargets(partner.sourceName).catch(() => [])
      : [];
  const votingOpen = isPublicVotingOpen() && voteTargets.length > 0;
  const openCategoryIds = votingOpen ? voteTargets.map((target) => target.categoryId) : [];

  const voterKey = (await cookies()).get(VOTER_COOKIE)?.value?.trim() ?? "";
  const unrestricted = isVotingBlastActive();
  const dailyStatus =
    votingOpen && voterKey
      ? await getVoterDailyStatus(voterKey)
      : {
          votesToday: 0,
          votesRemaining: unrestricted ? Number.MAX_SAFE_INTEGER : DAILY_VOTE_LIMIT,
          votedCategoryIds: [] as string[],
          unrestricted,
        };

  const showVoteSection = Boolean(partner) && isNominee && voteTargets.length > 0;

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <VotingStartsNotice className="mx-auto mb-6 max-w-lg" />
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        {partner && showVoteSection && votingOpen ? (
          <NomineeVoteSection
            nomineeName={partner.sourceName}
            targets={voteTargets}
            votingOpen={votingOpen}
            openCategoryIds={openCategoryIds}
            votesRemaining={dailyStatus.votesRemaining}
            votedCategoryIds={dailyStatus.votedCategoryIds}
            unrestricted={dailyStatus.unrestricted}
          />
        ) : null}
        <TicketPartnerGateForm
          partner={partner}
          slug={slug}
          ticketmasterUrl={ticketmasterDestination()}
          gateUrl={ticketPartnerTrackingUrl(partner?.slug ?? slug)}
        />
        {partner && showVoteSection && !votingOpen ? (
          <NomineeVoteSection
            nomineeName={partner.sourceName}
            targets={voteTargets}
            votingOpen={votingOpen}
            openCategoryIds={openCategoryIds}
            votesRemaining={dailyStatus.votesRemaining}
            votedCategoryIds={dailyStatus.votedCategoryIds}
            unrestricted={dailyStatus.unrestricted}
          />
        ) : null}
      </div>
    </div>
  );
}
