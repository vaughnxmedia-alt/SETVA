import type { Metadata } from "next";
import {
  AmbassadorRegistrationClosed,
  AmbassadorRegistrationForm,
} from "@/components/ambassadors/AmbassadorRegistrationForm";
import { SectionHeading } from "@/components/SectionHeading";
import { isAmbassadorRegistrationOpen } from "@/lib/ambassadors";
import { site, ticketPartnerInfo } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ambassador Registration",
  description: `Register as a SETVA Ticket Partner and earn ${ticketPartnerInfo.commissionPercent}% commission on ticket sales.`,
};

export default function AmbassadorsPage() {
  const isOpen = isAmbassadorRegistrationOpen();

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Ticket Partner Program"
          title="Ambassador registration"
          subtitle={`Register to become a SETVA ambassador for ${site.event.title}. Share your custom ticket link and earn ${ticketPartnerInfo.commissionPercent}% on qualifying sales.`}
        />
        <div className="mt-10">
          {isOpen ? (
            <AmbassadorRegistrationForm />
          ) : (
            <AmbassadorRegistrationClosed opensLabel={ticketPartnerInfo.registrationOpensLabel} />
          )}
        </div>
      </div>
    </div>
  );
}
