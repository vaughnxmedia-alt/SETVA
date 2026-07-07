"use client";

import { hqFetch } from "@/lib/headquarters/hq-fetch.client";
import { useEffect, useState } from "react";
import {
  sponsorOutreachEmailSubject,
  type SponsorOutreachLead,
} from "@/lib/sponsor-outreach-email";

type SponsorOutreachEmailPreviewProps = {
  lead: SponsorOutreachLead;
  packageId?: string;
  emailCopy?: string;
  teamMember?: string;
};

type PreviewPayload = {
  subject: string;
  html: string;
};

export function SponsorOutreachEmailPreview({
  lead,
  packageId,
  emailCopy,
  teamMember,
}: SponsorOutreachEmailPreviewProps) {
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lead.email.trim()) {
      setPreview(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadPreview() {
      setLoading(true);
      try {
        const res = await hqFetch("/api/headquarters/sponsors/send-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            preview: true,
            name: lead.name === "there" ? "Contact" : lead.name,
            email: lead.email,
            company: lead.company,
            packageId: packageId || undefined,
            teamMember: teamMember || undefined,
            emailCopy: emailCopy || undefined,
          }),
        });
        const data = (await res.json()) as PreviewPayload & { success?: boolean };
        if (!res.ok || !data.success) {
          setPreview({
            subject: sponsorOutreachEmailSubject(lead),
            html: "<p style='padding:24px;color:#666;font-family:sans-serif;'>Could not load preview.</p>",
          });
          return;
        }
        setPreview({ subject: data.subject, html: data.html });
      } catch (error) {
        if (controller.signal.aborted) return;
        setPreview({
          subject: sponsorOutreachEmailSubject(lead),
          html: "<p style='padding:24px;color:#666;font-family:sans-serif;'>Could not load preview.</p>",
        });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadPreview();
    return () => controller.abort();
  }, [lead, packageId, emailCopy, teamMember]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gold/15 bg-black/30 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cream/40">
          Subject
        </p>
        <p className="mt-1 text-sm text-cream/85">
          {loading && !preview ? "Loading preview…" : preview?.subject}
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-gold/15 bg-[#0b0000]">
        {preview ? (
          <iframe
            title="Sponsor outreach email preview"
            srcDoc={preview.html}
            className="h-[420px] w-full border-0 bg-[#0b0000]"
            sandbox="allow-same-origin"
          />
        ) : (
          <div className="flex h-[420px] items-center justify-center px-6 text-center text-sm text-cream/50">
            {lead.email.trim()
              ? loading
                ? "Loading preview…"
                : "Could not load preview."
              : "Enter an email address to preview the message."}
          </div>
        )}
      </div>
      <p className="text-[11px] text-cream/40">
        Preview is rendered by the same server template used when you send.
      </p>
    </div>
  );
}
