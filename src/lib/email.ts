import { Resend } from "resend";
import { site } from "@/lib/site";
import {
  sponsorDeck,
  sponsorDeckLogoUrl,
  sponsorDeckViewUrl,
  siteUrl,
} from "@/lib/sponsor-deck";

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

function sponsorDeckEmailHtml(
  lead: SponsorDeckLead,
  deckViewUrl: string,
  logoUrl: string,
): string {
  const greeting = escapeHtml(lead.name.trim());
  const companyLine = lead.company?.trim()
    ? `<p style="margin:0 0 20px;color:#555555;font-size:15px;line-height:1.6;">Prepared for <strong style="color:#000000;">${escapeHtml(lead.company.trim())}</strong></p>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(sponsorDeck.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0000;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b0000;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 18px 48px rgba(0,0,0,0.35);">
          <tr>
            <td style="background:linear-gradient(135deg,#000000 0%,#bf0000 100%);padding:28px 32px;text-align:center;">
              <img src="${logoUrl}" alt="${escapeHtml(site.fullName)}" width="220" style="display:block;margin:0 auto;max-width:220px;height:auto;" />
              <p style="margin:18px 0 0;color:#facd68;font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;">
                Partnership Opportunity
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 12px;">
              <p style="margin:0 0 12px;color:#000000;font-size:24px;line-height:1.3;font-weight:700;">
                Hi ${greeting},
              </p>
              <p style="margin:0 0 18px;color:#333333;font-size:16px;line-height:1.7;">
                Thank you for your interest in partnering with the
                <strong>Southeast Texas Visionary Awards (SETVA) 2026</strong>.
                Your exclusive sponsorship presentation — <em>${escapeHtml(sponsorDeck.title)}</em> — is ready to view.
              </p>
              ${companyLine}
              <p style="margin:0 0 28px;color:#555555;font-size:15px;line-height:1.6;">
                ${escapeHtml(site.event.dateLabel)} · ${escapeHtml(site.event.venue)}, ${escapeHtml(site.event.location)}
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="border-radius:999px;background-color:#bf0000;">
                    <a href="${deckViewUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.04em;">
                      View Sponsorship Deck
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#888888;font-size:13px;line-height:1.6;">
                This link is private and intended only for you. If the button does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${deckViewUrl}" style="color:#bf0000;font-size:13px;text-decoration:underline;">${deckViewUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fff8e8;border-radius:16px;border:1px solid #facd6840;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 8px;color:#bf0000;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">
                      Next step
                    </p>
                    <p style="margin:0;color:#333333;font-size:14px;line-height:1.6;">
                      Review the packages, then reply to this email or contact us at
                      <a href="mailto:${site.contact.email}" style="color:#bf0000;text-decoration:none;font-weight:600;">${site.contact.email}</a>
                      to confirm your tier or request an invoice.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#000000;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 6px;color:#facd68;font-size:14px;font-style:italic;">
                ${escapeHtml(site.motto)}
              </p>
              <p style="margin:0;color:#ffffff99;font-size:12px;">
                — The ${escapeHtml(site.name)} Team · ${escapeHtml(site.event.presenter)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function sponsorDeckLeadNotificationHtml(
  lead: SponsorDeckLead,
  deckViewUrl: string,
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
        Private deck link sent: <a href="${deckViewUrl}">${deckViewUrl}</a>
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

export async function sendSponsorDeckEmail(lead: SponsorDeckLead): Promise<string> {
  const base = siteUrl();
  const deckViewUrl = sponsorDeckViewUrl(base, lead);
  const logoUrl = sponsorDeckLogoUrl(base);
  const resend = resendClient();

  if (!resend) {
    console.info("[demo] Sponsor deck requested:", lead, deckViewUrl);
    return deckViewUrl;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: lead.email,
    replyTo: site.contact.email,
    subject: `Your ${sponsorDeck.title} — View Sponsorship Deck`,
    html: sponsorDeckEmailHtml(lead, deckViewUrl, logoUrl),
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
      html: sponsorDeckLeadNotificationHtml(lead, deckViewUrl),
    });
  }

  return deckViewUrl;
}
