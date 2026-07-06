import { MediaView } from "@/components/headquarters/MediaView";
import { listMediaCredentialTeamMembers } from "@/lib/media-credential-team-store";
import { listMediaCredentialApplications } from "@/lib/media-credentials-store";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const [applications, teamMemberSubmissions] = await Promise.all([
    listMediaCredentialApplications(),
    listMediaCredentialTeamMembers().catch(() => []),
  ]);
  return (
    <MediaView
      applications={applications}
      teamMemberSubmissions={teamMemberSubmissions}
    />
  );
}
