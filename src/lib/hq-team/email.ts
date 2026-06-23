import { Resend } from "resend";
import { site } from "@/lib/site";
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

function hqFromAddress(): string {
  return (
    process.env.HEADQUARTERS_TEAM_FROM_EMAIL?.trim() ||
    process.env.SPONSOR_DECK_FROM_EMAIL?.trim() ||
    "SETVA <onboarding@resend.dev>"
  );
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

export async function sendHQWelcomeEmail(input: {
  name: string;
  email: string;
  setvaId: string;
}): Promise<void> {
  const client = resendClient();
  if (!client) {
    console.info("[demo] HQ welcome email:", input);
    return;
  }

  const loginUrl = `${siteUrl()}/headquarters/login`;
  const body = `
    <p style="margin:0 0 16px;color:#111111;font-size:24px;line-height:1.3;font-weight:700;">
      Welcome, ${escapeHtml(input.name)}
    </p>
    <p style="margin:0 0 18px;color:#444444;font-size:15px;line-height:1.7;">
      Your SETVA Headquarters account is active. Use your email and the password you chose to sign in.
    </p>
    <p style="margin:0 0 8px;color:#111111;font-size:16px;font-weight:700;letter-spacing:0.06em;">
      ${escapeHtml(input.setvaId)}
    </p>
    <p style="margin:0 0 18px;color:#666666;font-size:14px;line-height:1.6;">
      Your SETVA team ID for reference.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 0;">
      <tr>
        <td style="border-radius:999px;background-color:#bf0000;">
          <a href="${loginUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.04em;">
            Sign in to Headquarters
          </a>
        </td>
      </tr>
    </table>
  `;

  const { error } = await client.emails.send({
    from: hqFromAddress(),
    to: input.email,
    replyTo: site.contact.email,
    subject: "Your SETVA Headquarters account is ready",
    html: emailShell("Welcome to Headquarters", body),
  });

  if (error) throw new Error(error.message);
}
