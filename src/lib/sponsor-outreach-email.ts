import { getSponsorPackage } from "@/lib/sponsor-intake";
import {
  sponsorDeckLogoUrl,
  sponsorsCheckoutUrl,
  sponsorsPageUrl,
} from "@/lib/sponsor-deck";
import { site } from "@/lib/site";
import { getPublicSiteUrl } from "@/lib/site-url";

export type SponsorOutreachLead = {
  name: string;
  email: string;
  company?: string;
};

export type SponsorOutreachEmailInput = {
  lead: SponsorOutreachLead;
  packageId?: string;
  emailCopy?: string;
  teamMember?: string;
  baseUrl?: string;
};

export const DEFAULT_SPONSOR_OUTREACH_COPY =
  "Thank you for your interest in partnering with SETVA 2026. Review the packages below and click Buy when you're ready to secure your sponsorship.";

export function isCustomOutreachCopy(copy?: string): boolean {
  const trimmed = copy?.trim();
  return Boolean(trimmed && trimmed !== DEFAULT_SPONSOR_OUTREACH_COPY);
}

export function sponsorOutreachBaseUrl(): string {
  return getPublicSiteUrl();
}

export function sponsorOutreachEmailLogoUrl(): string {
  return sponsorDeckLogoUrl(sponsorOutreachBaseUrl());
}

export function sponsorOutreachLinkUrl(
  input: Pick<SponsorOutreachEmailInput, "packageId" | "baseUrl">,
): string {
  const base = input.baseUrl ?? sponsorOutreachBaseUrl();
  return input.packageId
    ? sponsorsCheckoutUrl(input.packageId, base)
    : sponsorsPageUrl(base);
}

export function sponsorOutreachButtonLabel(packageId?: string): string {
  if (!packageId) return "View all sponsor packages";
  const pkg = getSponsorPackage(packageId);
  if (!pkg) return "View sponsor packages";
  return `Buy ${pkg.name} — $${pkg.price.toLocaleString()}`;
}

export function sponsorOutreachEmailSubject(lead: SponsorOutreachLead): string {
  const company = lead.company?.trim();
  if (company) return `SETVA 2026 sponsorship — ${company}`;
  return "SETVA 2026 — View sponsor packages";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function linkifyLine(line: string): string {
  let html = escapeHtml(line);
  html = html.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<a href="mailto:$1" style="color:#bf0000;text-decoration:none;font-weight:600;">$1</a>',
  );
  html = html.replace(
    /(www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<a href="https://$1" style="color:#bf0000;text-decoration:none;font-weight:600;">$1</a>',
  );
  html = html.replace(
    /(?<!href="https?:\/\/)(?<![/@])setvawards\.com/g,
    '<a href="https://www.setvawards.com" style="color:#bf0000;text-decoration:none;font-weight:600;">setvawards.com</a>',
  );
  return html;
}

function bodyCopyParagraphs(copy: string): string {
  return copy
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const lines = paragraph.split("\n").map((line) => linkifyLine(line));
      return `<p style="margin:0 0 16px;color:#333333;font-size:16px;line-height:1.65;">${lines.join("<br />")}</p>`;
    })
    .join("");
}

export function buildSponsorOutreachEmailHtml(input: SponsorOutreachEmailInput): string {
  const base = input.baseUrl ?? sponsorOutreachBaseUrl();
  const linkUrl = sponsorOutreachLinkUrl(input);
  const logoUrl = sponsorOutreachEmailLogoUrl();
  const buttonLabel = escapeHtml(sponsorOutreachButtonLabel(input.packageId));
  const greeting = escapeHtml(input.lead.name.trim());
  const copy = input.emailCopy?.trim() || DEFAULT_SPONSOR_OUTREACH_COPY;
  const customCopy = isCustomOutreachCopy(input.emailCopy);
  const teamMember = input.teamMember?.trim();
  const greetingBlock = customCopy
    ? ""
    : `<p style="margin:0 0 12px;color:#000000;font-size:22px;line-height:1.3;font-weight:700;">Hi ${greeting},</p>`;
  const companyLine = input.lead.company?.trim()
    ? `<p style="margin:0 0 16px;color:#555555;font-size:14px;line-height:1.6;">Prepared for <strong style="color:#000000;">${escapeHtml(input.lead.company.trim())}</strong></p>`
    : "";
  const contactLine =
    customCopy || !teamMember
      ? ""
      : `<p style="margin:0;color:#333333;font-size:14px;line-height:1.6;">Your SETVA contact: <strong>${escapeHtml(teamMember)}</strong></p>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SETVA 2026 Sponsorship</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0000;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b0000;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#000000 0%,#bf0000 100%);padding:24px 28px;text-align:center;">
              <img src="${logoUrl}" alt="${escapeHtml(site.fullName)}" width="220" height="auto" style="display:block;margin:0 auto;max-width:220px;height:auto;border:0;outline:none;text-decoration:none;" />
              <p style="margin:14px 0 0;color:#facd68;font-size:10px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;">
                Southeast Texas Visionary Awards
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              ${greetingBlock}
              ${bodyCopyParagraphs(copy)}
              ${companyLine}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px auto 20px;">
                <tr>
                  <td style="border-radius:999px;background-color:#facd68;">
                    <a href="${linkUrl}" style="display:inline-block;padding:14px 28px;color:#000000;text-decoration:none;font-size:14px;font-weight:700;">
                      ${buttonLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;color:#888888;font-size:12px;line-height:1.5;text-align:center;">
                ${escapeHtml(site.event.dateLabel)} · ${escapeHtml(site.event.venue)}
              </p>
              <p style="margin:0 0 20px;color:#888888;font-size:12px;line-height:1.5;text-align:center;">
                All payments must be paid in full by ${escapeHtml(site.event.sponsorshipPaymentDue)}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              ${
                contactLine ||
                `<p style="margin:0;color:#333333;font-size:14px;line-height:1.6;">Questions? <a href="mailto:${site.contact.email}" style="color:#bf0000;text-decoration:none;font-weight:600;">${site.contact.email}</a></p>`
              }
            </td>
          </tr>
          <tr>
            <td style="background-color:#000000;padding:20px 28px;text-align:center;">
              <p style="margin:0;color:#facd68;font-size:13px;font-style:italic;">
                ${escapeHtml(site.motto)}
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

export function buildSponsorOutreachTeamNotificationHtml(
  input: SponsorOutreachEmailInput,
  linkUrl: string,
): string {
  const teamMember = input.teamMember?.trim();
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#111;">
      <h2 style="margin:0 0 16px;font-size:18px;">Sponsor packages link sent</h2>
      <p style="margin:0 0 8px;"><strong>Contact:</strong> ${escapeHtml(input.lead.name)}</p>
      <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(input.lead.email)}</p>
      ${
        input.lead.company?.trim()
          ? `<p style="margin:0 0 8px;"><strong>Company:</strong> ${escapeHtml(input.lead.company.trim())}</p>`
          : ""
      }
      ${
        teamMember
          ? `<p style="margin:0 0 8px;"><strong>Deal owner:</strong> ${escapeHtml(teamMember)}</p>`
          : ""
      }
      ${
        input.packageId
          ? `<p style="margin:0 0 8px;"><strong>Package:</strong> ${escapeHtml(sponsorOutreachButtonLabel(input.packageId))}</p>`
          : ""
      }
      <p style="margin:16px 0 0;font-size:14px;color:#444;">
        Link sent: <a href="${linkUrl}">${linkUrl}</a>
      </p>
    </div>
  `.trim();
}
