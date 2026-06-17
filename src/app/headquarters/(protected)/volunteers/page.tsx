import { VolunteersView } from "@/components/headquarters/VolunteersView";
import { getHQVolunteers } from "@/lib/headquarters/data";

export default async function VolunteersPage() {
  const volunteers = await getHQVolunteers();
  return <VolunteersView volunteers={volunteers} />;
}
