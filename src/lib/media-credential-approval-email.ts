import { site } from "@/lib/site";
import {
  mediaCredentialTeamMemberFormUrl,
  mediaCredentialTeamMemberWarning,
} from "@/lib/media-credential-team";
import { getPublicSiteUrl } from "@/lib/site-url";
import type { MediaCredentialApplication } from "@/lib/media-credentials";

export const MEDIA_CREDENTIAL_APPROVAL_EMAIL_SUBJECT =
  "SETVA 2026 Media Credential Approved — Sign-In Confirmation";

export const DEFAULT_MEDIA_CHECK_IN_TIME = "Begins at 3:30 pm";

const PREPARED_ITEMS = [
  "Your full name",
  "Media outlet / platform name",
  "Photo ID",
  "Confirmation email",
  "Any approved equipment listed on your application",
] as const;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function mediaCredentialApprovalFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName.trim();
}

export type MediaCredentialApprovalEmailInput = {
  application: Pick<
    MediaCredentialApplication,
    "id" | "fullName" | "email" | "mediaOutlet" | "teamMemberRoster"
  >;
  checkInTime: string;
  checkInLocation: string;
};

export type CompiledMediaCredentialApprovalEmail = {
  subject: string;
  html: string;
  plainText: string;
  checkInTime: string;
  checkInLocation: string;
};

export function compileMediaCredentialApprovalConfirmationEmail(
  input: MediaCredentialApprovalEmailInput,
): CompiledMediaCredentialApprovalEmail {
  const firstName = mediaCredentialApprovalFirstName(input.application.fullName);
  const checkInTime = input.checkInTime.trim() || DEFAULT_MEDIA_CHECK_IN_TIME;
  const checkInLocation =
    input.checkInLocation.trim() || "Designated Media Check-In area";
  const contactEmail = site.contact.email;
  const website = getPublicSiteUrl();
  const teamFormUrl = mediaCredentialTeamMemberFormUrl(
    input.application.id,
    input.application.email,
  );
  const roster = input.application.teamMemberRoster ?? [];
  const rosterLines =
    roster.length > 0
      ? [
          "",
          "Team members listed on your application:",
          ...roster.map((member) => `• ${member.name}`),
        ]
      : [];

  const teamSection = [
    "",
    "Team member registration (required):",
    "Each approved crew member must complete the SETVA media team registration form before event day. Share this link with every team member who will be on site:",
    "",
    teamFormUrl,
    "",
    mediaCredentialTeamMemberWarning,
    ...rosterLines,
  ];

  const plainText = [
    `Hello ${firstName},`,
    "",
    "Congratulations, your media credential request for the 2026 Southeast Texas Visionary Awards has been approved.",
    "",
    "To receive your media pass on event day, you will be required to check in at the designated Media Check-In area and verify your information.",
    "",
    "Please be prepared to provide:",
    "",
    ...PREPARED_ITEMS.map((item) => item),
    "",
    "Media passes are non-transferable and must only be used by the approved applicant. Additional guests, assistants, photographers, or videographers must be approved separately.",
    "",
    "Approved media will receive access based on credential type and assigned coverage areas. Please note that approved media access is limited to Outside Activities and the Lobby unless otherwise authorized by SETVA Media Relations.",
    "",
    "Event Details:",
    "2026 Southeast Texas Visionary Awards",
    "Saturday, August 8, 2026",
    "Jefferson Theatre",
    "Beaumont, Texas",
    "",
    `Media Check-In Time: ${checkInTime}`,
    `Media Check-In Location: ${checkInLocation}`,
    "",
    "Thank you for your interest in covering SETVA 2026. We look forward to welcoming you.",
    ...teamSection,
    "",
    "Sincerely,",
    "SETVA Media Relations Team",
    contactEmail,
    website,
  ].join("\n");

  const listHtml = PREPARED_ITEMS.map(
    (item) => `<li style="margin:0 0 6px;">${escapeHtml(item)}</li>`,
  ).join("");

  const rosterHtml =
    roster.length > 0
      ? `<p style="margin:12px 0 4px;"><strong>Team members listed on your application:</strong></p><ul style="margin:0 0 12px;padding-left:20px;">${roster
          .map((member) => `<li style="margin:0 0 4px;">${escapeHtml(member.name)}</li>`)
          .join("")}</ul>`
      : "";

  const html = `
    <div style="font-family:Georgia,'Times New Roman',serif;max-width:640px;color:#111;line-height:1.65;">
      <p style="margin:0 0 16px;">Hello ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 16px;">Congratulations, your media credential request for the 2026 Southeast Texas Visionary Awards has been approved.</p>
      <p style="margin:0 0 16px;">To receive your media pass on event day, you will be required to check in at the designated Media Check-In area and verify your information.</p>
      <p style="margin:0 0 8px;"><strong>Please be prepared to provide:</strong></p>
      <ul style="margin:0 0 16px;padding-left:20px;">${listHtml}</ul>
      <p style="margin:0 0 16px;">Media passes are non-transferable and must only be used by the approved applicant. Additional guests, assistants, photographers, or videographers must be approved separately.</p>
      <p style="margin:0 0 16px;">Approved media will receive access based on credential type and assigned coverage areas. Please note that approved media access is limited to Outside Activities and the Lobby unless otherwise authorized by SETVA Media Relations.</p>
      <div style="margin:16px 0;padding:16px;border-radius:12px;background:#f8f8f8;">
        <p style="margin:0 0 8px;"><strong>Event Details</strong></p>
        <p style="margin:0 0 4px;">2026 Southeast Texas Visionary Awards</p>
        <p style="margin:0 0 4px;">Saturday, August 8, 2026</p>
        <p style="margin:0 0 4px;">Jefferson Theatre</p>
        <p style="margin:0 0 12px;">Beaumont, Texas</p>
        <p style="margin:0 0 4px;"><strong>Media Check-In Time:</strong> ${escapeHtml(checkInTime)}</p>
        <p style="margin:0;"><strong>Media Check-In Location:</strong> ${escapeHtml(checkInLocation)}</p>
      </div>
      <p style="margin:0 0 16px;">Thank you for your interest in covering SETVA 2026. We look forward to welcoming you.</p>
      <div style="margin:16px 0;padding:16px;border-radius:12px;background:#fff7ed;border:1px solid #f0d9b5;">
        <p style="margin:0 0 8px;"><strong>Team member registration (required)</strong></p>
        <p style="margin:0 0 12px;">Each approved crew member must complete the SETVA media team registration form before event day. Share this link with every team member who will be on site:</p>
        <p style="margin:0 0 12px;"><a href="${escapeHtml(teamFormUrl)}" style="color:#bf0000;text-decoration:none;font-weight:600;">${escapeHtml(teamFormUrl)}</a></p>
        <p style="margin:0 0 12px;color:#8a4b08;"><strong>${escapeHtml(mediaCredentialTeamMemberWarning)}</strong></p>
        ${rosterHtml}
      </div>
      <p style="margin:0 0 4px;">Sincerely,</p>
      <p style="margin:0 0 4px;">SETVA Media Relations Team</p>
      <p style="margin:0 0 4px;"><a href="mailto:${escapeHtml(contactEmail)}" style="color:#bf0000;text-decoration:none;">${escapeHtml(contactEmail)}</a></p>
      <p style="margin:0;"><a href="${escapeHtml(website)}" style="color:#bf0000;text-decoration:none;">${escapeHtml(website)}</a></p>
    </div>
  `.trim();

  return {
    subject: MEDIA_CREDENTIAL_APPROVAL_EMAIL_SUBJECT,
    html,
    plainText,
    checkInTime,
    checkInLocation,
  };
}
