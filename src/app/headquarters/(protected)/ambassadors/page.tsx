import { AmbassadorsView } from "@/components/headquarters/AmbassadorsView";
import { getHQAmbassadors, getHQNomineeTicketPartners } from "@/lib/headquarters/data";

export default async function AmbassadorsPage() {
  const [nomineeLinks, ambassadors] = await Promise.all([
    getHQNomineeTicketPartners(),
    getHQAmbassadors(),
  ]);
  return <AmbassadorsView nomineeLinks={nomineeLinks} ambassadors={ambassadors} />;
}
