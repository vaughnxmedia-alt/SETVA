import { AmbassadorsView } from "@/components/headquarters/AmbassadorsView";
import { getHQSessionUser } from "@/lib/headquarters/auth-server";
import { getHQAmbassadors, getHQNomineeTicketPartners } from "@/lib/headquarters/data";

export default async function AmbassadorsPage() {
  const [nomineeLinks, ambassadors, currentUser] = await Promise.all([
    getHQNomineeTicketPartners(),
    getHQAmbassadors(),
    getHQSessionUser(),
  ]);
  return (
    <AmbassadorsView
      nomineeLinks={nomineeLinks}
      ambassadors={ambassadors}
      currentUser={currentUser}
    />
  );
}
