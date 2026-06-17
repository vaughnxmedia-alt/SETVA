import { MediaView } from "@/components/headquarters/MediaView";
import { getHQMediaApplications } from "@/lib/headquarters/data";

export default async function MediaPage() {
  const applications = await getHQMediaApplications();
  return <MediaView applications={applications} />;
}
