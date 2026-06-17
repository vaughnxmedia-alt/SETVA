import { Resend } from "resend";
import { site } from "@/lib/site";
import {
  getOfflinePaymentMethod,
  getSponsorPackage,
  type SponsorIntakeRecord,
} from "@/lib/sponsor-intake";
import { sponsorDeckLogoUrl, siteUrl } from "@/lib/sponsor-deck";

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

function intakeSummaryHtml(intake: SponsorIntakeRecord, pkgName: string, pkgPrice: number): string {
  return `
    <p style="margin:0 0 8px;"><strong>Package:</strong> ${escapeHtml(pkgName)} — $${pkgPrice.toLocaleString()}</p>
    <p style="margin:0 0 8px;"><strong>Company:</strong> ${escapeHtml(intake.companyName)}</p>
    <p style="margin:0 0 8px;"><strong>Contact:</strong> ${escapeHtml(intake.contactName)} · ${escapeHtml(intake.jobTitle)}</p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(intake.email)}</p>
    <p style="margin:0 0 8px;"><strong>Phone:</strong> ${escapeHtml(intake.phone)}</p>
    ${intake.website ? `<p style="margin:0 0 8px;"><strong>Website:</strong> ${escapeHtml(intake.website)}</p>` : ""}
    <p style="margin:0 0 8px;"><strong>Industry:</strong> ${escapeHtml(intake.industry)}</p>
    <p style="margin:0 0 8px;"><strong>Payment preference:</strong> ${escapeHtml(intake.preferredPayment)}</p>
    ${intake.meetingNotes ? `<p style="margin:0 0 8px;"><strong>Meeting notes:</strong> ${escapeHtml(intake.meetingNotes)}</p>` : ""}
    <p style="margin:0 0 8px;"><strong>Description:</strong> ${escapeHtml(intake.companyDescription)}</p>
    ${intake.socialMedia ? `<p style="margin:0 0 8px;"><strong>Social:</strong> ${escapeHtml(intake.socialMedia)}</p>` : ""}
    <p style="margin:16px 0 8px;"><strong>Primary goals</strong></p>
    <ul style="margin:0 0 12px;padding-left:20px;">${listHtml(intake.primaryGoals)}</ul>
    <p style="margin:0 0 8px;"><strong>Activation interests</strong></p>
    <ul style="margin:0 0 12px;padding-left:20px;">${listHtml(intake.activationInterests)}</ul>
    <p style="margin:0 0 8px;"><strong>Available assets</strong></p>
    <ul style="margin:0;padding-left:20px;">${listHtml(intake.availableAssets)}</ul>
  `;
}

export async function sendSponsorIntakePendingEmail(
  intake: SponsorIntakeRecord,
): Promise<void> {
  const resend = resendClient();
  const pkg = getSponsorPackage(intake.packageId);
  if (!pkg) return;

  if (!resend) {
    console.info("[demo] Sponsor intake pending:", intake);
    return;
  }

  const offlineMethod = getOfflinePaymentMethod(intake.preferredPayment);
  const statusLine = offlineMethod
    ? `A sponsor submitted the intake form and chose <strong>${escapeHtml(intake.preferredPayment)}</strong>.`
    : "A sponsor completed the intake form and was sent to Square checkout.";

  await resend.emails.send({
    from: fromAddress(),
    to: notifyAddress(),
    replyTo: intake.email,
    subject: `Sponsor intake — ${intake.companyName} (${pkg.name})`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">New sponsorship intake</h2>
        <p style="margin:0 0 16px;color:#444;">${statusLine}</p>
        ${intakeSummaryHtml(intake, pkg.name, pkg.price)}
      </div>
    `.trim(),
  });
}

function checkInstructionsHtml(pkgName: string, pkgPrice: number): string {
  const payment = site.sponsorPayment;
  return `
    <div style="margin:24px 0;padding:20px;border-radius:12px;background:#fff8e8;border:1px solid #facd6840;">
      <h3 style="margin:0 0 12px;color:#000;">Check or money order instructions</h3>
      <p style="margin:0 0 8px;"><strong>Amount:</strong> $${pkgPrice.toLocaleString()}</p>
      <p style="margin:0 0 8px;"><strong>Make payable to:</strong> ${escapeHtml(payment.checkPayableTo)}</p>
      <p style="margin:0 0 8px;"><strong>Memo line:</strong> ${escapeHtml(payment.checkMemoHint)} — ${escapeHtml(pkgName)}</p>
      <p style="margin:0 0 8px;color:#444;">${escapeHtml(payment.checkMailingNote)}</p>
      <p style="margin:0;color:#666;font-size:13px;">${escapeHtml(payment.policyNote)}</p>
    </div>
  `;
}

function meetingConfirmationHtml(
  intake: SponsorIntakeRecord,
  pkgName: string,
  pkgPrice: number,
): string {
  return `
    <div style="margin:24px 0;padding:24px;border-radius:16px;background:#fff8e8;border:1px solid #facd6840;">
      <h3 style="margin:0 0 16px;color:#000;font-size:18px;">Check or money order pickup meeting</h3>
      <p style="margin:0 0 16px;color:#444;line-height:1.6;">
        ${escapeHtml(site.sponsorPayment.meetingFollowUpNote)}
      </p>
      <p style="margin:0 0 16px;color:#444;line-height:1.6;">
        <strong>Payment method:</strong> Check or money order — bring payment payable to ${escapeHtml(site.sponsorPayment.checkPayableTo)}. Cash is not accepted.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;color:#333;">
        <tr><td style="padding:6px 0;"><strong>Package:</strong> ${escapeHtml(pkgName)} — $${pkgPrice.toLocaleString()}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Organization:</strong> ${escapeHtml(intake.companyName)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Contact:</strong> ${escapeHtml(intake.contactName)} · ${escapeHtml(intake.jobTitle)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Email:</strong> ${escapeHtml(intake.email)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Phone:</strong> ${escapeHtml(intake.phone)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Event:</strong> ${escapeHtml(site.event.title)} · ${escapeHtml(site.event.dateLabel)}</td></tr>
        <tr><td style="padding:6px 0;"><strong>Location:</strong> ${escapeHtml(site.event.venue)}, ${escapeHtml(site.event.location)}</td></tr>
      </table>
      <div style="margin-top:20px;padding:16px;border-radius:12px;background:#fff;border:1px solid #e8e8e8;">
        <p style="margin:0 0 8px;font-weight:600;color:#000;">Your requested meeting details</p>
        <p style="margin:0;color:#444;line-height:1.6;white-space:pre-wrap;">${escapeHtml(intake.meetingNotes)}</p>
      </div>
      <p style="margin:16px 0 0;color:#666;font-size:13px;">
        Need to update your availability? Reply to this email or call ${escapeHtml(site.contact.phone)}.
      </p>
    </div>
  `;
}

export async function sendSponsorPickupMeetingEmails(
  intake: SponsorIntakeRecord,
): Promise<void> {
  const resend = resendClient();
  const pkg = getSponsorPackage(intake.packageId);
  if (!pkg) return;

  const base = siteUrl();
  const logoUrl = sponsorDeckLogoUrl(base);

  if (!resend) {
    console.info("[demo] Sponsor pickup meeting:", intake);
    return;
  }

  const sponsorHtml = `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#0b0000;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#000,#bf0000);padding:28px;text-align:center;">
            <img src="${logoUrl}" alt="${escapeHtml(site.fullName)}" width="200" style="max-width:200px;height:auto;" />
            <p style="margin:16px 0 0;color:#facd68;font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;">
              Check or money order pickup confirmed
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:24px;color:#000;">Thank you, ${escapeHtml(intake.contactName)}</h1>
            <p style="margin:0 0 16px;line-height:1.7;color:#333;">
              We received your request to schedule a check or money order pickup meeting for
              <strong>${escapeHtml(pkg.name)}</strong> (${"$" + pkg.price.toLocaleString()}).
            </p>
            ${meetingConfirmationHtml(intake, pkg.name, pkg.price)}
          </td>
        </tr>
        <tr>
          <td style="background:#000;padding:20px;text-align:center;color:#facd68;font-size:13px;">
            ${escapeHtml(site.motto)}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();

  const { error: sponsorError } = await resend.emails.send({
    from: fromAddress(),
    to: intake.email,
    replyTo: site.contact.email,
    subject: `Check or money order pickup confirmed — ${pkg.name} · SETVA 2026`,
    html: sponsorHtml,
  });

  if (sponsorError) {
    throw new Error(sponsorError.message);
  }

  const { error: teamError } = await resend.emails.send({
    from: fromAddress(),
    to: notifyAddress(),
    replyTo: intake.email,
    subject: `Schedule check or money order pickup — ${intake.companyName} (${pkg.name})`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 8px;font-size:20px;">Pickup meeting requested — action needed</h2>
        <p style="margin:0 0 16px;color:#bf0000;font-weight:600;">
          Contact ${escapeHtml(intake.contactName)} to confirm meeting time and location.
        </p>
        <div style="margin:0 0 20px;padding:16px;border-radius:12px;background:#fff8e8;border:1px solid #facd6840;">
          <p style="margin:0 0 8px;"><strong>Requested availability:</strong></p>
          <p style="margin:0;white-space:pre-wrap;line-height:1.6;">${escapeHtml(intake.meetingNotes)}</p>
        </div>
        ${intakeSummaryHtml(intake, pkg.name, pkg.price)}
        <p style="margin:16px 0 0;">
          <a href="mailto:${escapeHtml(intake.email)}" style="color:#bf0000;">Email sponsor</a>
          · <a href="${site.contact.phoneHref}" style="color:#bf0000;">Call ${escapeHtml(site.contact.phone)}</a>
        </p>
      </div>
    `.trim(),
  });

  if (teamError) {
    throw new Error(teamError.message);
  }
}

export async function sendSponsorOfflineConfirmationEmail(
  intake: SponsorIntakeRecord,
): Promise<void> {
  const resend = resendClient();
  const pkg = getSponsorPackage(intake.packageId);
  if (!pkg) return;

  const base = siteUrl();
  const logoUrl = sponsorDeckLogoUrl(base);
  const method = getOfflinePaymentMethod(intake.preferredPayment);

  if (!resend) {
    console.info("[demo] Sponsor offline request:", intake);
    return;
  }

  let extraHtml = "";
  let subjectSuffix = "request received";

  if (method === "check") {
    extraHtml = checkInstructionsHtml(pkg.name, pkg.price);
    subjectSuffix = "check or money order payment instructions";
  } else if (method === "meeting") {
    await sendSponsorPickupMeetingEmails(intake);
    return;
  }

  await resend.emails.send({
    from: fromAddress(),
    to: intake.email,
    replyTo: site.contact.email,
    subject: `SETVA 2026 sponsorship — ${subjectSuffix}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#0b0000;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#000,#bf0000);padding:28px;text-align:center;">
            <img src="${logoUrl}" alt="${escapeHtml(site.fullName)}" width="200" style="max-width:200px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:24px;color:#000;">Thank you, ${escapeHtml(intake.contactName)}</h1>
            <p style="margin:0 0 16px;line-height:1.7;color:#333;">
              We received your <strong>${escapeHtml(pkg.name)}</strong> sponsorship request
              (${"$" + pkg.price.toLocaleString()}) for SETVA 2026.
            </p>
            ${extraHtml}
            <p style="margin:0;color:#555;font-size:14px;">
              Questions? Contact
              <a href="mailto:${site.contact.email}" style="color:#bf0000;">${site.contact.email}</a>
              or ${escapeHtml(site.contact.phone)}.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  });
}

export async function sendSponsorCheckoutConfirmationEmail(
  intake: SponsorIntakeRecord,
): Promise<void> {
  const resend = resendClient();
  const pkg = getSponsorPackage(intake.packageId);
  if (!pkg) return;

  const base = siteUrl();
  const logoUrl = sponsorDeckLogoUrl(base);

  if (!resend) {
    console.info("[demo] Sponsor checkout confirmed:", intake);
    return;
  }

  await resend.emails.send({
    from: fromAddress(),
    to: intake.email,
    replyTo: site.contact.email,
    subject: `SETVA 2026 sponsorship received — ${pkg.name}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#0b0000;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#000,#bf0000);padding:28px;text-align:center;">
            <img src="${logoUrl}" alt="${escapeHtml(site.fullName)}" width="200" style="max-width:200px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:24px;color:#000;">Thank you, ${escapeHtml(intake.contactName)}</h1>
            <p style="margin:0 0 16px;line-height:1.7;color:#333;">
              We received your sponsorship for <strong>${escapeHtml(pkg.name)}</strong>
              (${"$" + pkg.price.toLocaleString()}) for the Southeast Texas Visionary Awards 2026.
            </p>
            <p style="margin:0 0 16px;line-height:1.7;color:#333;">
              Our team will follow up with next steps for asset collection, activation planning,
              and sponsor portal access. Logo uploads and detailed activation notes happen after payment
              inside the sponsor portal — not during checkout.
            </p>
            <p style="margin:0;color:#555;font-size:14px;">
              Questions? Reply to this email or contact
              <a href="mailto:${site.contact.email}" style="color:#bf0000;">${site.contact.email}</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#000;padding:20px;text-align:center;color:#facd68;font-size:13px;">
            ${escapeHtml(site.motto)}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  });

  await resend.emails.send({
    from: fromAddress(),
    to: notifyAddress(),
    replyTo: intake.email,
    subject: `Sponsorship payment completed — ${intake.companyName}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:640px;color:#111;">
        <h2 style="margin:0 0 16px;">Sponsorship checkout complete</h2>
        <p style="margin:0 0 16px;color:#444;">Payment was completed through Square. Follow up for portal access and asset collection.</p>
        ${intakeSummaryHtml(intake, pkg.name, pkg.price)}
      </div>
    `.trim(),
  });
}
