"use client";

import { useMemo } from "react";
import {
  buildSponsorOutreachEmailHtml,
  sponsorOutreachEmailSubject,
  type SponsorOutreachLead,
} from "@/lib/sponsor-outreach-email";

type SponsorOutreachEmailPreviewProps = {
  lead: SponsorOutreachLead;
  packageId?: string;
  emailCopy?: string;
  teamMember?: string;
};

export function SponsorOutreachEmailPreview({
  lead,
  packageId,
  emailCopy,
  teamMember,
}: SponsorOutreachEmailPreviewProps) {
  const subject = useMemo(
    () => sponsorOutreachEmailSubject(lead),
    [lead],
  );

  const html = useMemo(
    () =>
      buildSponsorOutreachEmailHtml({
        lead,
        packageId: packageId || undefined,
        emailCopy,
        teamMember,
        baseUrl:
          typeof window !== "undefined"
            ? window.location.origin
            : undefined,
      }),
    [lead, packageId, emailCopy, teamMember],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gold/15 bg-black/30 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cream/40">
          Subject
        </p>
        <p className="mt-1 text-sm text-cream/85">{subject}</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-gold/15 bg-[#0b0000]">
        <iframe
          title="Sponsor outreach email preview"
          srcDoc={html}
          className="h-[420px] w-full border-0 bg-[#0b0000]"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
