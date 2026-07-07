"use client";

import { hqFetch } from "@/lib/headquarters/hq-fetch.client";
import { useEffect, useState } from "react";
import { MEDIA_CREDENTIAL_APPROVAL_EMAIL_SUBJECT } from "@/lib/media-credential-approval-email";
import type { MediaCredentialApplication } from "@/lib/media-credentials";

type MediaCredentialApprovalEmailPreviewProps = {
  application: Pick<
    MediaCredentialApplication,
    "id" | "fullName" | "email" | "mediaOutlet" | "teamMemberRoster"
  >;
  checkInTime: string;
  checkInLocation: string;
};

type PreviewPayload = {
  subject: string;
  html: string;
  plainText: string;
};

export function MediaCredentialApprovalEmailPreview({
  application,
  checkInTime,
  checkInLocation,
}: MediaCredentialApprovalEmailPreviewProps) {
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPreview() {
      setLoading(true);
      setError(null);
      try {
        const res = await hqFetch("/api/headquarters/media/preview-approval-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            applicationId: application.id,
            checkInTime,
            checkInLocation,
          }),
        });
        const data = (await res.json()) as PreviewPayload & {
          success?: boolean;
          error?: string;
        };

        if (!res.ok || !data.success) {
          setError(data.error ?? "Could not load email preview.");
          setPreview(null);
          return;
        }

        setPreview({
          subject: data.subject,
          html: data.html,
          plainText: data.plainText,
        });
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError("Could not load email preview.");
        setPreview(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadPreview();
    return () => controller.abort();
  }, [application.id, checkInTime, checkInLocation]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gold/15 bg-black/30 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cream/40">
          Subject
        </p>
        <p className="mt-1 text-sm text-cream">
          {preview?.subject ?? MEDIA_CREDENTIAL_APPROVAL_EMAIL_SUBJECT}
        </p>
      </div>

      {loading ? (
        <div className="flex h-[420px] items-center justify-center rounded-lg border border-gold/15 bg-black/20 text-sm text-cream/50">
          Loading email preview…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : preview ? (
        <>
          <div className="overflow-hidden rounded-lg border border-gold/15 bg-[#f5f5f5]">
            <iframe
              title="Media credential approval email preview"
              srcDoc={preview.html}
              className="h-[420px] w-full border-0 bg-white"
              sandbox=""
            />
          </div>

          <details className="rounded-lg border border-gold/10 bg-black/20 px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-cream/60">
              Plain-text version
            </summary>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-relaxed text-cream/70">
              {preview.plainText}
            </pre>
          </details>
        </>
      ) : null}

      <p className="text-xs text-cream/45">
        Sending to <span className="text-cream/70">{application.email}</span>. The template
        includes the team registration link, roster names, and your check-in details.
      </p>
    </div>
  );
}
