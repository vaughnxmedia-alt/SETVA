import { SponsorsView } from "@/components/headquarters/SponsorsView";
import { getHQSponsorPipeline } from "@/lib/headquarters/data";

export default async function SponsorsPage() {
  const sponsors = await getHQSponsorPipeline();
  return <SponsorsView sponsors={sponsors} />;
}
