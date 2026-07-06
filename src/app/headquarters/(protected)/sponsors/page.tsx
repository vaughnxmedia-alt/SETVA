import { SponsorsView } from "@/components/headquarters/SponsorsView";
import { getHQSponsorPipeline } from "@/lib/headquarters/data";
import { listHQTeamMembers } from "@/lib/hq-team/store";

export default async function SponsorsPage() {
  const [sponsors, teamMembers] = await Promise.all([
    getHQSponsorPipeline(),
    listHQTeamMembers(),
  ]);

  return (
    <SponsorsView
      sponsors={sponsors}
      teamMembers={teamMembers
        .filter((member) => member.status === "active")
        .map((member) => ({ name: member.name, email: member.email }))}
    />
  );
}
