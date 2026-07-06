import { SponsorPackagesView } from "@/components/headquarters/SponsorPackagesView";
import { getHQSponsorPackageInventory } from "@/lib/headquarters/data";

export default async function SponsorsPackagesPage() {
  const packages = await getHQSponsorPackageInventory();

  return <SponsorPackagesView packages={packages} />;
}
