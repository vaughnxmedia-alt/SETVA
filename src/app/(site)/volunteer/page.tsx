import type { Metadata } from "next";
import { VolunteerRegistrationForm } from "@/components/volunteers/VolunteerRegistrationForm";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Volunteer",
  description: `Register to volunteer at ${site.event.title}.`,
};

export default function VolunteerPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Serve SETVA"
          title="Volunteer registration"
          subtitle={`Register your interest in volunteering for ${site.event.title}. Choose pre-event, event day, and post-event opportunities — our team will review your availability and follow up with next steps.`}
        />
        <div className="mt-10">
          <VolunteerRegistrationForm />
        </div>
      </div>
    </div>
  );
}
