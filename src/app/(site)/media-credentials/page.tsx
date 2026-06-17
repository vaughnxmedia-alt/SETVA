import type { Metadata } from "next";
import { MediaCredentialAccessPolicy } from "@/components/media-credentials/MediaCredentialAccessPolicy";
import { MediaCredentialApplicationForm } from "@/components/media-credentials/MediaCredentialApplicationForm";
import { SectionHeading } from "@/components/SectionHeading";
import { mediaCredentialAccessPolicySummary } from "@/lib/media-credentials";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Media Credentials",
  description: `Apply for red carpet media credentials for ${site.event.title}.`,
  robots: { index: true, follow: true },
};

export default function MediaCredentialsPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Press & creators"
          title="Media credentials"
          subtitle={`Apply for red carpet media credentials at ${site.event.title}. ${mediaCredentialAccessPolicySummary}`}
        />

        <div className="mt-10 space-y-10">
          <MediaCredentialAccessPolicy />
          <MediaCredentialApplicationForm />
        </div>
      </div>
    </div>
  );
}
