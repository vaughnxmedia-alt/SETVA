import { Resend } from "resend";
import { site } from "@/lib/site";
import { sponsorDeck, sponsorDeckDownloadUrl, siteUrl } from "@/lib/sponsor-deck";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  return (
    process.env.SPONSOR_DECK_FROM_EMAIL?.trim() ??
    "SETVA <onboarding@resend.dev>"
  );
}

type SponsorDeckLead = {
  name: string;
  email: string;
  company?: string;
};

function sponsorDeckEmailHtml(lead: SponsorDeckLead, downloadUrl: string): string {
  const greeting = lead.name.trim();
  const companyLine = lead.company?.trim()
    ? `<p style="margin:0 0 16px;color:#444;">Organization: <strong>${escapeHtml(lead.company.trim())}</strong></p>`
    : "";

  return `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#111;">
      <p style="margin:0 0 16px;">Hi ${escapeHtml(greeting)},</p>
      <p style="margin:0 0 16px;line-height:1.6;">
        Thank you for your interest in partnering with the
        <strong>Southeast Texas Visionary Awards (SETVA) 2026</strong>.
        Your sponsorship deck — <em>${escapeHtml(sponsorDeck.title)}</em> — is ready.
      </p>
      ${companyLine}
      <p style="margin:0 0 24px;">
        <a href="${downloadUrl}" style="display:inline-block;background:#bf0000;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;">
          Download sponsorship deck
        </a>
      </p>
      <p style="margin:0 0 16px;line-height:1.6;color:#444;font-size:14px;">
        If the button does not work, copy and paste this link into your browser:<br />
        <a href="${downloadUrl}" style="color:#bf0000;word-break:break-all;">${downloadUrl}</a>
      </p>
      <p style="margin:0 0 8px;line-height:1.6;color:#444;font-size:14px;">
        Questions about packages or a custom partnership? Reply to this email or contact us at
        <a href="mailto:${site.contact.email}" style="color:#bf0000;">${site.contact.email}</a>.
      </p>
      <p style="margin:24px 0 0;color:#666;font-size:13px;">
        ${site.motto}<br />
        — The ${site.name} Team
      </p>
    </div>
  `.trim();
}

function sponsorDeckLeadNotificationHtml(
  lead: SponsorDeckLead,
  downloadUrl: string,
): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#111;">
      <h2 style="margin:0 0 16px;font-size:18px;">New sponsor deck request</h2>
      <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(lead.name)}</p>
      <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
      ${
        lead.company?.trim()
          ? `<p style="margin:0 0 8px;"><strong>Company:</strong> ${escapeHtml(lead.company.trim())}</p>`
          : ""
      }
      <p style="margin:16px 0 0;font-size:14px;color:#444;">
        Deck link sent: <a href="${downloadUrl}">${downloadUrl}</a>
      </p>
    </div>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendSponsorDeckEmail(lead: SponsorDeckLead): Promise<void> {
  const resend = resendClient();
  const downloadUrl = sponsorDeckDownloadUrl(siteUrl());

  if (!resend) {
    console.info("[demo] Sponsor deck requested:", lead, downloadUrl);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: lead.email,
    replyTo: site.contact.email,
    subject: `Your ${sponsorDeck.title} sponsorship deck`,
    html: sponsorDeckEmailHtml(lead, downloadUrl),
  });

  if (error) {
    throw new Error(error.message);
  }

  const notifyEmail = process.env.SPONSOR_DECK_NOTIFY_EMAIL?.trim();
  if (notifyEmail) {
    await resend.emails.send({
      from: fromAddress(),
      to: notifyEmail,
      replyTo: lead.email,
      subject: `Sponsor deck requested — ${lead.name}`,
      html: sponsorDeckLeadNotificationHtml(lead, downloadUrl),
    });
  }
}
