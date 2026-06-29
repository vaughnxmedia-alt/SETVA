import { Resend } from "resend";
import { site } from "@/lib/site";
import { teamNotifyEmails } from "@/lib/team-notify";
import type { VolunteerRegistration } from "@/lib/volunteers";
import { volunteerSuccessMessage } from "@/lib/volunteers";
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
  if (items.length === 0) return "<li>None selected</li>";
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function optionalLine(label: string, value: string): string {
  if (!value.trim()) return "";
  return `<p style="margin:0 0 8px;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

function registrationSummaryHtml(registration: VolunteerRegistration): string {
  return `
    <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(registration.fullName)}</p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(registration.email)}</p>
    <p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(registration.phone)}</p>
    ${optionalLine("Birthday", registration.birthday)}
    <p style="margin:16px 0 8px;"><strong>Volunteer categories</strong></p>
    <ul style="margin:0 0 12px;padding-left:20px;">${listHtml(registration.volunteerCategories)}</ul>
    <p style="margin:0 0 8px;"><strong>Availability windows</strong></p>
    <ul style="margin:0 0 12px;padding-left:20px;">${listHtml(registration.availabilityWindows)}</ul>
    ${registration.preEventInterests.length > 0 ? `<p style="margin:0 0 8px;"><strong>Pre-event interests</strong></p><ul style="margin:0 0 12px;padding-left:20px;">${listHtml(registration.preEventInterests)}</ul>` : ""}
    ${registration.eventDayInterests.length > 0 ? `<p style="margin:0 0 8px;"><strong>Event day interests</strong></p><ul style="margin:0 0 12px;padding-left:20px;">${listHtml(registration.eventDayInterests)}</ul>` : ""}
    ${registration.postEventInterests.length > 0 ? `<p style="margin:0 0 8px;"><strong>Post-event interests</strong></p><ul style="margin:0 0 12px;padding-left:20px;">${listHtml(registration.postEventInterests)}</ul>` : ""}
    ${optionalLine("Previous experience", registration.previousExperience)}
    ${optionalLine("Skills", registration.relevantSkills)}
    ${optionalLine("Notes", registration.notes)}
    <p style="margin:0 0 8px;"><strong>Emergency contact:</strong> ${escapeHtml(registration.emergencyContactName)} · ${escapeHtml(registration.emergencyContactPhone)}</p>
  `;
}

function confirmationDetailsHtml(registration: VolunteerRegistration): string {
  return `
    ${optionalLine("Volunteer role", registration.assignedRole)}
    ${optionalLine("Volunteer category", registration.assignedCategory)}
    ${optionalLine("Shift date", registration.shiftDate)}
    ${optionalLine("Shift time", registration.shiftTime)}
    ${optionalLine("Report time", registration.reportTime)}
    ${optionalLine("Report location", registration.reportLocation)}
    ${optionalLine("Supervisor / contact", registration.supervisorName)}
    ${registration.dressCode ? `<div style="margin:16px 0;"><strong>Dress code</strong><p style="margin:8px 0 0;white-space:pre-wrap;">${escapeHtml(registration.dressCode)}</p></div>` : ""}
    ${registration.parkingCheckInInstructions ? `<div style="margin:16px 0;"><strong>Parking / check-in</strong><p style="margin:8px 0 0;white-space:pre-wrap;">${escapeHtml(registration.parkingCheckInInstructions)}</p></div>` : ""}
    ${registration.conductExpectations ? `<div style="margin:16px 0;"><strong>Conduct expectations</strong><p style="margin:8px 0 0;white-space:pre-wrap;">${escapeHtml(registration.conductExpectations)}</p></div>` : ""}
  `;
}

export async function sendVolunteerConfirmationEmail(
  registration: VolunteerRegistration,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Volunteer confirmation:", registration.email);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: registration.email,
    replyTo: site.contact.email,
    subject: `SETVA 2026 Volunteer Registration Received`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">Registration received</h2>
        <p style="margin:0 0 16px;color:#444;">Hi ${escapeHtml(registration.fullName)},</p>
        <p style="margin:0 0 16px;color:#444;">${escapeHtml(volunteerSuccessMessage)}</p>
        <p style="margin:0 0 8px;"><strong>Event:</strong> ${escapeHtml(site.event.title)}</p>
        <p style="margin:24px 0 0;color:#666;font-size:14px;">${escapeHtml(site.contact.email)} · ${escapeHtml(site.contact.phone)}</p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

export async function sendVolunteerTeamNotification(
  registration: VolunteerRegistration,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Volunteer team notification:", registration.id);
    return;
  }

  const adminUrl = `${getPublicSiteUrl()}/admin/volunteers`;

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: notifyAddress(),
    replyTo: registration.email,
    subject: `Volunteer registration — ${registration.fullName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:720px;color:#111;">
        <h2 style="margin:0 0 16px;">New volunteer registration</h2>
        <p style="margin:0 0 16px;color:#444;">Status: <strong>Pending Review</strong></p>
        ${registrationSummaryHtml(registration)}
        <p style="margin:24px 0 0;"><a href="${escapeHtml(adminUrl)}">Review in admin</a></p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

export async function sendVolunteerApprovedEmail(
  registration: VolunteerRegistration,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Volunteer approved:", registration.email);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: registration.email,
    replyTo: site.contact.email,
    subject: `SETVA 2026 Volunteer Confirmation`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">You're confirmed for SETVA 2026</h2>
        <p style="margin:0 0 16px;color:#444;">Hi ${escapeHtml(registration.fullName)},</p>
        <p style="margin:0 0 16px;color:#444;">Thank you for volunteering for ${escapeHtml(site.event.title)}. Your registration has been ${registration.status === "Confirmed" ? "confirmed" : "approved"}.</p>
        ${confirmationDetailsHtml(registration)}
        <p style="margin:24px 0 0;color:#666;font-size:14px;">${escapeHtml(site.contact.email)} · ${escapeHtml(site.contact.phone)}</p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

export async function sendVolunteerWaitlistedEmail(
  registration: VolunteerRegistration,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Volunteer waitlisted:", registration.email);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: registration.email,
    replyTo: site.contact.email,
    subject: `SETVA 2026 Volunteer — Waitlisted`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">You have been waitlisted</h2>
        <p style="margin:0 0 16px;color:#444;">Hi ${escapeHtml(registration.fullName)},</p>
        <p style="margin:0 0 16px;color:#444;">Thank you for registering to volunteer at ${escapeHtml(site.event.title)}. We have placed you on our waitlist and will contact you if a placement becomes available.</p>
        <p style="margin:24px 0 0;color:#666;font-size:14px;">${escapeHtml(site.contact.email)} · ${escapeHtml(site.contact.phone)}</p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

export async function sendVolunteerDeniedEmail(
  registration: VolunteerRegistration,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Volunteer denied:", registration.email);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: registration.email,
    replyTo: site.contact.email,
    subject: `SETVA 2026 Volunteer Update`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">Volunteer registration update</h2>
        <p style="margin:0 0 16px;color:#444;">Hi ${escapeHtml(registration.fullName)},</p>
        <p style="margin:0 0 16px;color:#444;">Thank you for your interest in volunteering at ${escapeHtml(site.event.title)}. We are unable to offer a volunteer placement at this time. We appreciate your heart for SETVA and hope you will stay connected with our community.</p>
        <p style="margin:24px 0 0;color:#666;font-size:14px;">${escapeHtml(site.contact.email)} · ${escapeHtml(site.contact.phone)}</p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

export async function sendVolunteerStatusEmail(
  registration: VolunteerRegistration,
  previousStatus: string,
): Promise<void> {
  if (registration.status === previousStatus) return;

  if (registration.status === "Approved" || registration.status === "Confirmed") {
    await sendVolunteerApprovedEmail(registration);
    return;
  }

  if (registration.status === "Waitlisted") {
    await sendVolunteerWaitlistedEmail(registration);
    return;
  }

  if (registration.status === "Denied") {
    await sendVolunteerDeniedEmail(registration);
  }
}
