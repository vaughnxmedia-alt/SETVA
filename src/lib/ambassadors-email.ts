import { Resend } from "resend";
import { site, ticketPartnerInfo } from "@/lib/site";
import { teamNotifyEmails } from "@/lib/team-notify";
import type { AmbassadorRegistration } from "@/lib/ambassadors";
import { ambassadorSuccessMessage } from "@/lib/ambassadors";
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

function registrationSummaryHtml(registration: AmbassadorRegistration): string {
  return `
    <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(registration.fullName)}</p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(registration.email)}</p>
    <p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(registration.phone)}</p>
    <p style="margin:0 0 8px;"><strong>City:</strong> ${escapeHtml(registration.city)}</p>
    ${optionalLine("Organization", registration.organization)}
    <p style="margin:16px 0 8px;"><strong>Promotion channels</strong></p>
    <ul style="margin:0 0 12px;padding-left:20px;">${listHtml(registration.promotionChannels)}</ul>
    ${optionalLine("Social / web", registration.socialHandle)}
    ${optionalLine("Estimated reach", registration.estimatedReach)}
    ${optionalLine("Why join", registration.whyJoin)}
  `;
}

export async function sendAmbassadorConfirmationEmail(
  registration: AmbassadorRegistration,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Ambassador confirmation:", registration.email);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: registration.email,
    replyTo: site.contact.email,
    subject: "SETVA 2026 Ambassador Registration Received",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">Registration received</h2>
        <p style="margin:0 0 16px;color:#444;">Hi ${escapeHtml(registration.fullName)},</p>
        <p style="margin:0 0 16px;color:#444;">${escapeHtml(ambassadorSuccessMessage())}</p>
        <p style="margin:0 0 8px;"><strong>Event:</strong> ${escapeHtml(site.event.title)}</p>
        <p style="margin:24px 0 0;color:#666;font-size:14px;">${escapeHtml(site.contact.email)} · ${escapeHtml(site.contact.phone)}</p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

export async function sendAmbassadorApprovedEmail(
  registration: AmbassadorRegistration,
): Promise<void> {
  const resend = resendClient();
  const trackingUrl =
    registration.ambassadorLink.trim() ||
    (registration.ticketPartnerSlug.trim()
      ? `${getPublicSiteUrl()}/go/tickets/${registration.ticketPartnerSlug.trim()}`
      : "");

  if (!trackingUrl) {
    throw new Error("Ambassador tracking link is missing; cannot send approval email.");
  }

  if (!resend) {
    console.info("[demo] Ambassador approved:", registration.email, trackingUrl);
    return;
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: registration.email,
    replyTo: site.contact.email,
    subject: "SETVA 2026 Ambassador Approved — Your Ticket Link",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">You're approved</h2>
        <p style="margin:0 0 16px;color:#444;">Hi ${escapeHtml(registration.fullName)},</p>
        <p style="margin:0 0 16px;color:#444;">
          Welcome to the SETVA Ticket Partner (Ambassador) program. Your custom tracking link is ready —
          share it with your network and earn ${ticketPartnerInfo.commissionPercent}% commission on qualifying ticket sales.
        </p>
        <p style="margin:0 0 8px;"><strong>Your unique ticket link</strong></p>
        <p style="margin:0 0 20px;">
          <a href="${escapeHtml(trackingUrl)}" style="color:#8a6d1d;word-break:break-all;">${escapeHtml(trackingUrl)}</a>
        </p>
        <p style="margin:0 0 24px;">
          <a href="${escapeHtml(trackingUrl)}"
             style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;">
            Open my ticket link
          </a>
        </p>
        <p style="margin:0 0 8px;color:#444;"><strong>How it works</strong></p>
        <ol style="margin:0 0 16px;padding-left:20px;color:#444;">
          ${ticketPartnerInfo.steps.map((step) => `<li style="margin:0 0 6px;">${escapeHtml(step)}</li>`).join("")}
        </ol>
        <p style="margin:0 0 8px;"><strong>Event:</strong> ${escapeHtml(site.event.title)}</p>
        <p style="margin:24px 0 0;color:#666;font-size:14px;">${escapeHtml(site.contact.email)} · ${escapeHtml(site.contact.phone)}</p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}

/** Sends the approval email when status moves into Approved/Active. */
export async function sendAmbassadorStatusEmail(
  registration: AmbassadorRegistration,
  previousStatus: string,
): Promise<void> {
  if (registration.status === previousStatus) return;

  const approvedStatuses = new Set(["Approved", "Active"]);
  if (!approvedStatuses.has(registration.status) || approvedStatuses.has(previousStatus)) {
    return;
  }

  await sendAmbassadorApprovedEmail(registration);
}

export async function sendAmbassadorTeamNotification(
  registration: AmbassadorRegistration,
): Promise<void> {
  const resend = resendClient();
  if (!resend) {
    console.info("[demo] Ambassador team notification:", registration.id);
    return;
  }

  const hqUrl = `${getPublicSiteUrl()}/headquarters/ambassadors`;

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: notifyAddress(),
    replyTo: registration.email,
    subject: `Ambassador registration — ${registration.fullName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:720px;color:#111;">
        <h2 style="margin:0 0 16px;">New ambassador registration</h2>
        <p style="margin:0 0 16px;color:#444;">Status: <strong>Pending Review</strong></p>
        ${registrationSummaryHtml(registration)}
        <p style="margin:24px 0 0;"><a href="${escapeHtml(hqUrl)}">Review in Headquarters</a></p>
      </div>
    `.trim(),
  });

  if (error) throw error;
}
