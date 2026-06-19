import { Resend } from "resend";
import { montCityNetwork, site } from "@/lib/site";
import type { MediaCredentialApplication } from "@/lib/media-credentials";
import {
  mediaCredentialAccessZones,
  mediaCredentialSuccessMessage,
} from "@/lib/media-credentials";

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

function notifyAddress(): string {
  return (
    process.env.SPONSOR_DECK_NOTIFY_EMAIL?.trim() ?? site.contact.email
  );
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

  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000"}/admin/media-credentials`;

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
