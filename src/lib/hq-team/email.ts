import { Resend } from "resend";
import { site } from "@/lib/site";
import { teamNotifyEmails } from "@/lib/team-notify";
import { siteUrl, sponsorDeckLogoUrl } from "@/lib/sponsor-deck";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function requireResendClient(): Resend {
  const client = resendClient();
  if (!client) {
    throw new Error("Email is not configured.");
  }
  return client;
}

async function sendEmail(input: Parameters<Resend["emails"]["send"]>[0]): Promise<void> {
  const client = requireResendClient();
  const { error } = await client.emails.send(input);
  if (error) {
    throw new Error(error.message);
  }
}

export function hqTeamFromAddress(): string {
  return (
    process.env.HEADQUARTERS_TEAM_FROM_EMAIL?.trim() ||
    process.env.SPONSOR_DECK_FROM_EMAIL?.trim() ||
    "SETVA <onboarding@resend.dev>"
  );
}

export function hqTeamNotifyEmails(): string[] {
  const configured = teamNotifyEmails();
  const required = [site.contact.email, "setvaawards@gmail.com"];
  return [...new Set([...configured, ...required.map((email) => email.trim()).filter(Boolean)])];
}

function emailShell(title: string, body: string): string {
  const logoUrl = sponsorDeckLogoUrl(siteUrl());
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
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
                SETVA Headquarters
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 32px;">
              ${body}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 0;">
  <tr>
    <td style="border-radius:999px;background-color:#bf0000;">
      <a href="${href}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

export async function sendHQAccessRequestEmail(input: {
  name: string;
  email: string;
  confirmUrl: string;
}): Promise<void> {
  const body = `
    <p style="margin:0 0 16px;color:#111111;font-size:24px;line-height:1.3;font-weight:700;">
      New Headquarters access request
    </p>
    <p style="margin:0 0 18px;color:#444444;font-size:15px;line-height:1.7;">
      <strong>${escapeHtml(input.name)}</strong> requested SETVA Headquarters access.
    </p>
    <p style="margin:0 0 8px;color:#444444;font-size:15px;line-height:1.7;">
      Email: ${escapeHtml(input.email)}
    </p>
    <p style="margin:18px 0 0;color:#666666;font-size:14px;line-height:1.6;">
      Confirm this team member to issue a SETVA ID and invite them to create their account.
    </p>
    ${button(input.confirmUrl, "Confirm team member")}
  `;

  await sendEmail({
    from: hqTeamFromAddress(),
    to: hqTeamNotifyEmails(),
    replyTo: input.email,
    subject: `HQ access request — ${input.name}`,
    html: emailShell("HQ access request", body),
  });
}

export async function sendHQApprovalEmail(input: {
  name: string;
  email: string;
  setvaId: string;
  activateUrl: string;
  forceRelogin?: boolean;
}): Promise<void> {
  const intro = input.forceRelogin
    ? "Your SETVA Headquarters access has been updated. Use your SETVA ID below to sign in again immediately."
    : "Your SETVA Headquarters access request was approved. Use your SETVA ID below to create your account.";

  const body = `
    <p style="margin:0 0 16px;color:#111111;font-size:24px;line-height:1.3;font-weight:700;">
      Hi ${escapeHtml(input.name)},
    </p>
    <p style="margin:0 0 18px;color:#444444;font-size:15px;line-height:1.7;">
      ${escapeHtml(intro)}
    </p>
    <p style="margin:0 0 8px;color:#111111;font-size:18px;font-weight:700;letter-spacing:0.08em;">
      ${escapeHtml(input.setvaId)}
    </p>
    <p style="margin:0 0 18px;color:#666666;font-size:14px;line-height:1.6;">
      Keep this SETVA ID secure. You will need it to finish account setup and sign in to Headquarters.
    </p>
    ${button(input.activateUrl, input.forceRelogin ? "Sign in to Headquarters" : "Create your account")}
  `;

  await sendEmail({
    from: hqTeamFromAddress(),
    to: input.email,
    replyTo: site.contact.email,
    subject: input.forceRelogin
      ? `Your SETVA ID — please sign in again`
      : `Your SETVA ID — create your Headquarters account`,
    html: emailShell("SETVA Headquarters access", body),
  });
}

export async function sendHQRequestReceivedEmail(input: {
  name: string;
  email: string;
}): Promise<void> {
  const body = `
    <p style="margin:0 0 16px;color:#111111;font-size:24px;line-height:1.3;font-weight:700;">
      Request received
    </p>
    <p style="margin:0 0 18px;color:#444444;font-size:15px;line-height:1.7;">
      Hi ${escapeHtml(input.name)}, we received your SETVA Headquarters access request.
      SETVA leadership will review it and email you a SETVA ID if approved.
    </p>
  `;

  await sendEmail({
    from: hqTeamFromAddress(),
    to: input.email,
    replyTo: site.contact.email,
    subject: "SETVA Headquarters access request received",
    html: emailShell("Request received", body),
  });
}
