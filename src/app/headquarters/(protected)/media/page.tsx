import { MediaView } from "@/components/headquarters/MediaView";
import { listMediaCredentialApplications } from "@/lib/media-credentials-store";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const applications = await listMediaCredentialApplications();
  return <MediaView applications={applications} />;
}
