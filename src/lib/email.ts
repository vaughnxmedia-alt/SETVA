import { Resend } from "resend";
import { site } from "@/lib/site";
import { teamNotifyEmails } from "@/lib/team-notify";
import {
  buildSponsorOutreachEmailHtml,
  buildSponsorOutreachTeamNotificationHtml,
  sponsorOutreachEmailSubject,
  sponsorOutreachLinkUrl,
  type SponsorOutreachEmailInput,
  type SponsorOutreachLead,
} from "@/lib/sponsor-outreach-email";
import { siteUrl } from "@/lib/sponsor-deck";

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

type SponsorDeckEmailOptions = {
  packageId?: string;
  emailCopy?: string;
  teamMember?: string;
};

function outreachInput(
  lead: SponsorOutreachLead,
  options?: SponsorDeckEmailOptions,
): SponsorOutreachEmailInput {
  return {
    lead,
    packageId: options?.packageId,
    emailCopy: options?.emailCopy,
    teamMember: options?.teamMember,
    baseUrl: siteUrl(),
  };
}

export async function sendSponsorDeckEmail(
  lead: SponsorOutreachLead,
  options?: SponsorDeckEmailOptions,
): Promise<string> {
  const input = outreachInput(lead, options);
  const linkUrl = sponsorOutreachLinkUrl(input);
  const resend = resendClient();
  if (!resend) {
    throw new Error("Email is not configured");
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: lead.email,
    replyTo: site.contact.email,
    subject: sponsorOutreachEmailSubject(lead),
    html: buildSponsorOutreachEmailHtml(input),
  });

  if (error) {
    throw new Error(error.message);
  }

  const notifyEmails = teamNotifyEmails();
  if (notifyEmails.length > 0) {
    await resend.emails.send({
      from: fromAddress(),
      to: notifyEmails,
      replyTo: lead.email,
      subject: `Sponsor packages link sent — ${lead.name}`,
      html: buildSponsorOutreachTeamNotificationHtml(input, linkUrl),
    });
  }

  return linkUrl;
}
