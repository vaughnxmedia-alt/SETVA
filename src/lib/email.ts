import { Resend } from "resend";
import { site } from "@/lib/site";
import { teamNotifyEmails } from "@/lib/team-notify";
import {
  buildSponsorOutreachEmailHtml,
  buildSponsorOutreachTeamNotificationHtml,
  sponsorOutreachBaseUrl,
  sponsorOutreachEmailSubject,
  sponsorOutreachLinkUrl,
  type SponsorOutreachEmailInput,
  type SponsorOutreachLead,
} from "@/lib/sponsor-outreach-email";

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
    "SETVA Awards <onboarding@resend.dev>"
  );
}

type SponsorDeckEmailOptions = {
  packageId?: string;
  emailCopy?: string;
  teamMember?: string;
};

export type CompiledSponsorOutreachEmail = {
  input: SponsorOutreachEmailInput;
  subject: string;
  html: string;
  linkUrl: string;
};

function normalizeOutreachInput(
  lead: SponsorOutreachLead,
  options?: SponsorDeckEmailOptions,
): SponsorOutreachEmailInput {
  return {
    lead,
    packageId: options?.packageId,
    emailCopy: options?.emailCopy,
    teamMember: options?.teamMember,
    baseUrl: sponsorOutreachBaseUrl(),
  };
}

/** Single compile step used by HQ preview and outbound send — guarantees parity. */
export function compileSponsorOutreachEmail(
  lead: SponsorOutreachLead,
  options?: SponsorDeckEmailOptions,
): CompiledSponsorOutreachEmail {
  const input = normalizeOutreachInput(lead, options);
  return {
    input,
    subject: sponsorOutreachEmailSubject(lead),
    html: buildSponsorOutreachEmailHtml(input),
    linkUrl: sponsorOutreachLinkUrl(input),
  };
}

export async function sendCompiledSponsorOutreachEmail(
  to: string,
  compiled: CompiledSponsorOutreachEmail,
): Promise<string> {
  const resend = resendClient();
  if (!resend) {
    throw new Error("Email is not configured");
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to,
    replyTo: site.contact.email,
    subject: compiled.subject,
    html: compiled.html,
  });

  if (error) {
    throw new Error(error.message);
  }

  const notifyEmails = teamNotifyEmails();
  if (notifyEmails.length > 0) {
    await resend.emails.send({
      from: fromAddress(),
      to: notifyEmails,
      replyTo: to,
      subject: `Sponsor packages link sent — ${compiled.input.lead.name}`,
      html: buildSponsorOutreachTeamNotificationHtml(compiled.input, compiled.linkUrl),
    });
  }

  return compiled.linkUrl;
}

export async function sendSponsorDeckEmail(
  lead: SponsorOutreachLead,
  options?: SponsorDeckEmailOptions,
): Promise<string> {
  const compiled = compileSponsorOutreachEmail(lead, options);
  return sendCompiledSponsorOutreachEmail(lead.email, compiled);
}
