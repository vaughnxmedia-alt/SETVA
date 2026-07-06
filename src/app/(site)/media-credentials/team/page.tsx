import type { Metadata } from "next";
import { MediaCredentialTeamMemberForm } from "@/components/media-credentials/MediaCredentialTeamMemberForm";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Media Team Registration",
  description: `Register as a media team member for ${site.event.title}.`,
  robots: { index: false, follow: false },
};

export default async function MediaCredentialTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ application?: string; access?: string }>;
}) {
  const params = await searchParams;
  const applicationId = params.application?.trim() ?? "";
  const accessToken = params.access?.trim() ?? "";

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Media team"
          title="Team member registration"
          subtitle="Complete this form if you are an approved crew member covering SETVA 2026 with your outlet."
        />

        <div className="mt-10">
          {!applicationId || !accessToken ? (
            <div className="rounded-2xl border border-gold/20 bg-ink-deep/60 p-6 text-sm text-cream/70">
              This page requires a valid registration link from your outlet&apos;s SETVA media
              approval email.
            </div>
          ) : (
            <MediaCredentialTeamMemberForm
              applicationId={applicationId}
              accessToken={accessToken}
            />
          )}
        </div>
      </div>
    </div>
  );
}
