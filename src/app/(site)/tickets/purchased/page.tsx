import { Suspense } from "react";
import { TicketPurchasedClient } from "@/components/tickets/TicketPurchasedClient";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Ticket purchase recorded",
  description: "Thank you for supporting SETVA through a ticket partner link.",
  path: "/tickets/purchased",
});

export default function TicketPurchasedPage() {
  return (
    <Suspense>
      <TicketPurchasedClient />
    </Suspense>
  );
}
