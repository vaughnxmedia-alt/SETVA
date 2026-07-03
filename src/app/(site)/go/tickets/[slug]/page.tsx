import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TicketPartnerGateForm } from "@/components/tickets/TicketPartnerGateForm";
import { NomineeVoteSection } from "@/components/tickets/NomineeVoteSection";
import { recordTicketLinkEvent } from "@/lib/ticket-link-events-store";
import { createPageMetadata } from "@/lib/metadata";
import { listNomineeVoteTargets, resolveTicketPartnerBySlug } from "@/lib/ticket-partner/resolve";
import { getVoterDailyStatus } from "@/lib/votes-store";
import { DAILY_VOTE_LIMIT, isVotingOpen, VOTER_COOKIE } from "@/lib/voting";

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

  const votingOpen = isVotingOpen();
  const isNominee = partner.sourceType === "nominee";

  const voterKey = (await cookies()).get(VOTER_COOKIE)?.value?.trim() ?? "";
  const [voteTargets, dailyStatus] = await Promise.all([
    isNominee ? listNomineeVoteTargets(partner.sourceName) : Promise.resolve([]),
    votingOpen && voterKey
      ? getVoterDailyStatus(voterKey)
      : Promise.resolve({ votesToday: 0, votesRemaining: DAILY_VOTE_LIMIT, votedCategoryIds: [] }),
  ]);

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <TicketPartnerGateForm partner={partner} />
      <NomineeVoteSection
        nomineeName={partner.sourceName}
        targets={voteTargets}
        votingOpen={votingOpen}
        votesRemaining={dailyStatus.votesRemaining}
        votedCategoryIds={dailyStatus.votedCategoryIds}
      />
    </div>
  );
}
