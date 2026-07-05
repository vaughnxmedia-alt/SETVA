import { Resend } from "resend";
import { montCityNetwork, site } from "@/lib/site";
import { teamNotifyEmails } from "@/lib/team-notify";
import type { MediaCredentialApplication } from "@/lib/media-credentials";
import {
  mediaCredentialAccessZones,
  mediaCredentialSuccessMessage,
} from "@/lib/media-credentials";
import { getPublicSiteUrl } from "@/lib/site-url";

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

function notifyAddress(): string[] {
  return teamNotifyEmails();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function listHtml(items: string[]): string {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function optionalLine(label: string, value: string): string {
  if (!value.trim()) return "";
  return `<p style="margin:0 0 8px;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

function applicationSummaryHtml(application: MediaCredentialApplication): string {
  return `
    <p style="margin:0 0 8px;"><strong>Applicant:</strong> ${escapeHtml(application.fullName)}</p>
    <p style="margin:0 0 8px;"><strong>Outlet:</strong> ${escapeHtml(application.mediaOutlet)}</p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(application.email)}</p>
    <p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(application.phone)}</p>
    <p style="margin:0 0 8px;"><strong>Location:</strong> ${escapeHtml(application.cityState)}</p>
    ${optionalLine("Website", application.website)}
    ${optionalLine("Instagram", application.instagram)}
    ${optionalLine("TikTok", application.tiktok)}
    ${optionalLine("YouTube", application.youtube)}
    ${optionalLine("Facebook", application.facebook)}
    ${optionalLine("Followers / subscribers", application.totalFollowers)}
    ${optionalLine("Average views or reach", application.averageReach)}
    <p style="margin:0 0 8px;"><strong>Team members:</strong> ${escapeHtml(application.teamMembers)}</p>
    <p style="margin:0 0 8px;"><strong>Equipment:</strong> ${escapeHtml(application.equipment)}</p>
    ${optionalLine("Portfolio", application.portfolioLink)}
    ${optionalLine("Previous coverage", application.previousCoverageLink)}
    <p style="margin:0 0 8px;"><strong>Emergency contact:</strong> ${escapeHtml(application.emergencyContactName)} · ${escapeHtml(application.emergencyContactPhone)}</p>
    <p style="margin:16px 0 8px;"><strong>Coverage types</strong></p>
    <ul style="margin:0 0 12px;padding-left:20px;">${listHtml(application.coverageTypes)}</ul>
    ${optionalLine("Additional comments", application.additionalComments)}
  `;
}

function accessPolicyHtml(): string {
  const items = mediaCredentialAccessZones
    .map(
      (zone) =>
        `<li style="margin:0 0 8px;"><strong>${escapeHtml(zone.title)}:</strong> ${escapeHtml(zone.policy)}</li>`,
    )
    .join("");

  return `
    <div style="margin:16px 0;padding:16px;border-radius:12px;background:#f8f8f8;">
      <p style="margin:0 0 8px;"><strong>SETVA access zones</strong></p>
      <ul style="margin:0;padding-left:20px;color:#444;">${items}</ul>
    </div>
  `;
}

function approvalDetailsHtml(application: MediaCredentialApplication): string {
  return `
    ${accessPolicyHtml()}
    ${optionalLine("Credential type", application.credentialType)}
    ${optionalLine("Credential number", application.credentialNumber)}
    ${optionalLine("Approved crew size", application.approvedCrewSize || application.teamMembers)}
    ${optionalLine("Arrival time", application.arrivalTime)}
    ${optionalLine("Pickup location", application.pickupLocation)}
    ${optionalLine("Seating assignment", application.seatingAssignment)}
    ${application.coverageGuidelines ? `<div style="margin:16px 0;"><strong>Coverage guidelines</strong><p style="margin:8px 0 0;white-space:pre-wrap;">${escapeHtml(application.coverageGuidelines)}</p></div>` : ""}
    ${application.checkInInstructions ? `<div style="margin:16px 0;"><strong>Check-in instructions</strong><p style="margin:8px 0 0;white-space:pre-wrap;">${escapeHtml(application.checkInInstructions)}</p></div>` : ""}
    ${application.parkingInformation ? `<div style="margin:16px 0;"><strong>Parking information</strong><p style="margin:8px 0 0;white-space:pre-wrap;">${escapeHtml(application.parkingInformation)}</p></div>` : ""}
    ${application.contactInformation ? `<div style="margin:16px 0;"><strong>Contact information</strong><p style="margin:8px 0 0;white-space:pre-wrap;">${escapeHtml(application.contactInformation)}</p></div>` : ""}
  `;
}

export async function sendMediaCredentialConfirmationEmail(
  application: MediaCredentialApplication,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Media credential confirmation:", application.email);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: application.email,
    replyTo: site.contact.email,
    subject: `SETVA 2026 Media Credential Application Received`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">Application received</h2>
        <p style="margin:0 0 16px;color:#444;">Hi ${escapeHtml(application.fullName)},</p>
        <p style="margin:0 0 16px;color:#444;">${escapeHtml(mediaCredentialSuccessMessage)}</p>
        <p style="margin:0 0 8px;"><strong>Outlet:</strong> ${escapeHtml(application.mediaOutlet)}</p>
        <p style="margin:0 0 8px;"><strong>Event:</strong> ${escapeHtml(site.event.title)}</p>
        <p style="margin:24px 0 0;color:#666;font-size:14px;">${escapeHtml(site.contact.email)} · ${escapeHtml(site.contact.phone)}</p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

export async function sendMediaCredentialTeamNotification(
  application: MediaCredentialApplication,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Media credential team notification:", application.id);
    return;
  }

  const adminUrl = `${getPublicSiteUrl()}/admin/media-credentials`;

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: notifyAddress(),
    replyTo: application.email,
    subject: `Media credential application — ${application.mediaOutlet} (${application.fullName})`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:720px;color:#111;">
        <h2 style="margin:0 0 16px;">New media credential application</h2>
        <p style="margin:0 0 16px;color:#444;">Status: <strong>Pending Review</strong></p>
        ${applicationSummaryHtml(application)}
        <p style="margin:24px 0 0;"><a href="${escapeHtml(adminUrl)}">Review in admin</a></p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

export async function sendMediaCredentialApprovedEmail(
  application: MediaCredentialApplication,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Media credential approved:", application.email);
    return;
  }

  const restricted = application.status === "Approved with Restrictions";

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: application.email,
    replyTo: site.contact.email,
    subject: `SETVA 2026 Media Credential ${restricted ? "Approved with Restrictions" : "Approved"}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">Your media credential has been ${restricted ? "approved with restrictions" : "approved"}</h2>
        <p style="margin:0 0 16px;color:#444;">Hi ${escapeHtml(application.fullName)},</p>
        <p style="margin:0 0 16px;color:#444;">Congratulations — your request to cover ${escapeHtml(site.event.title)} has been ${restricted ? "approved with restrictions" : "approved"}.</p>
        ${approvalDetailsHtml(application)}
        <div style="margin:24px 0;padding:16px;border-radius:12px;background:#f8f8f8;">
          <p style="margin:0 0 8px;"><strong>Event day check-in</strong></p>
          <p style="margin:0;color:#444;">Please bring a government-issued photo ID, this approval email, and only the approved number of crew members listed above. Standard credentials are Red Carpet Only. If lobby access was approved separately, your email will include those details.</p>
        </div>
        <p style="margin:24px 0 0;color:#666;font-size:14px;">${escapeHtml(site.contact.email)} · ${escapeHtml(site.contact.phone)}</p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName.trim();
}

/**
 * Sends the official SETVA media sign-in confirmation used when a credential is
 * approved from Headquarters. Check-in time and location are provided per-send.
 */
export async function sendMediaCredentialApprovalConfirmationEmail(
  application: MediaCredentialApplication,
  options: { checkInTime: string; checkInLocation: string },
): Promise<void> {
  const checkInTime = options.checkInTime.trim() || "To be announced";
  const checkInLocation = options.checkInLocation.trim() || "Designated Media Check-In area";

  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Media credential approval confirmation:", application.email, {
      checkInTime,
      checkInLocation,
    });
    return;
  }

  const requirements = [
    "Your full name",
    "Media outlet / platform name",
    "Photo ID",
    "Confirmation email",
    "Any approved equipment listed on your application",
  ];

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: application.email,
    replyTo: site.contact.email,
    subject: "SETVA 2026 Media Credential Approved — Sign-In Confirmation",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;line-height:1.6;">
        <p style="margin:0 0 16px;">Hello ${escapeHtml(firstName(application.fullName))},</p>
        <p style="margin:0 0 16px;">Congratulations, your media credential request for the 2026 Southeast Texas Visionary Awards has been approved.</p>
        <p style="margin:0 0 16px;">To receive your media pass on event day, you will be required to check in at the designated Media Check-In area and verify your information.</p>
        <p style="margin:0 0 8px;"><strong>Please be prepared to provide:</strong></p>
        <ul style="margin:0 0 16px;padding-left:20px;">${listHtml(requirements)}</ul>
        <p style="margin:0 0 16px;">Media passes are non-transferable and must only be used by the approved applicant. Additional guests, assistants, photographers, or videographers must be approved separately.</p>
        <p style="margin:0 0 16px;">Approved media will receive access based on credential type and assigned coverage areas. Please note that access may vary between red carpet, outside media areas, and inside venue coverage.</p>
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
        <p style="margin:0 0 4px;">Sincerely,</p>
        <p style="margin:0 0 4px;">SETVA Media Relations Team</p>
        <p style="margin:0 0 4px;">${escapeHtml(site.contact.email)}</p>
        <p style="margin:0;">${escapeHtml(getPublicSiteUrl())}</p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

export async function sendMediaCredentialWaitlistedEmail(
  application: MediaCredentialApplication,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Media credential waitlisted:", application.email);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: application.email,
    replyTo: site.contact.email,
    subject: `SETVA 2026 Media Credential — Waitlisted`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">You have been waitlisted</h2>
        <p style="margin:0 0 16px;color:#444;">Hi ${escapeHtml(application.fullName)},</p>
        <p style="margin:0 0 16px;color:#444;">Thank you for applying to cover ${escapeHtml(site.event.title)}. Your media credential request has been placed on our waitlist. We will contact you if additional credentials become available.</p>
        <p style="margin:24px 0 0;color:#666;font-size:14px;">${escapeHtml(site.contact.email)} · ${escapeHtml(site.contact.phone)}</p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

export async function sendMediaCredentialDeniedEmail(
  application: MediaCredentialApplication,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Media credential denied:", application.email);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: application.email,
    replyTo: site.contact.email,
    subject: `SETVA 2026 Media Credential Update`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">Media credential update</h2>
        <p style="margin:0 0 16px;color:#444;">Hi ${escapeHtml(application.fullName)},</p>
        <p style="margin:0 0 16px;color:#444;">Thank you for your interest in covering ${escapeHtml(site.event.title)}. After reviewing your application, we are unable to approve a media credential at this time. We appreciate your support of Southeast Texas visionaries and hope you will continue following SETVA online.</p>
        <p style="margin:24px 0 0;color:#666;font-size:14px;">${escapeHtml(site.contact.email)} · ${escapeHtml(site.contact.phone)}</p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

export async function sendMediaCredentialStatusEmail(
  application: MediaCredentialApplication,
  previousStatus: string,
): Promise<void> {
  if (application.status === previousStatus) return;

  if (
    application.status === "Approved" ||
    application.status === "Approved with Restrictions"
  ) {
    await sendMediaCredentialApprovedEmail(application);
    return;
  }

  if (application.status === "Waitlisted") {
    await sendMediaCredentialWaitlistedEmail(application);
    return;
  }

  if (application.status === "Denied") {
    await sendMediaCredentialDeniedEmail(application);
  }
}
