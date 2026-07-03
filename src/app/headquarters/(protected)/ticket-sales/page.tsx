import { TicketSalesView } from "@/components/headquarters/TicketSalesView";
import { getHQSessionUser } from "@/lib/headquarters/auth-server";

export default async function TicketSalesPage() {
  const currentUser = await getHQSessionUser();
  return <TicketSalesView currentUser={currentUser} />;
}
