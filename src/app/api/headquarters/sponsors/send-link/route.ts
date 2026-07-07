import { NextRequest, NextResponse } from "next/server";
import { compileSponsorOutreachEmail, sendCompiledSponsorOutreachEmail } from "@/lib/email";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { FORM_TYPES } from "@/lib/form-submissions";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { persistFormSubmission } from "@/lib/persist-form-submission";
import { sponsorsCheckoutUrl } from "@/lib/sponsor-deck";
import { sponsorOutreachBaseUrl } from "@/lib/sponsor-outreach-email";
import { getSponsorPackage } from "@/lib/sponsor-intake";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_COPY_LENGTH = 16000;

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function parseBody(body: Record<string, unknown>) {
  const name = normalizeText(body.name, 120);
  const email = normalizeText(body.email, 254).toLowerCase();
  const company = normalizeText(body.company, 160);
  const packageId = normalizeText(body.packageId, 80);
  const teamMember = normalizeText(body.teamMember, 120);
  const emailCopy = normalizeText(body.emailCopy, MAX_EMAIL_COPY_LENGTH);

  return { name, email, company, packageId, teamMember, emailCopy };
}

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const { name, email, company, packageId, teamMember, emailCopy } = parseBody(body);

  if (!name) {
    return NextResponse.json({ success: false, error: "Name is required." }, { status: 400 });
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ success: false, error: "A valid email is required." }, { status: 400 });
  }

  if (packageId && !getSponsorPackage(packageId)) {
    return NextResponse.json({ success: false, error: "Invalid package." }, { status: 400 });
  }

  const lead = { name, email, company: company || undefined };
  const compiled = compileSponsorOutreachEmail(lead, {
    packageId: packageId || undefined,
    emailCopy: emailCopy || undefined,
    teamMember: teamMember || undefined,
  });

  if (body.preview === true) {
    return NextResponse.json({
      success: true,
      preview: true,
      subject: compiled.subject,
      html: compiled.html,
      linkUrl: compiled.linkUrl,
    });
  }

  try {
    await persistFormSubmission({
      formType: FORM_TYPES.sponsorDeck,
      status: "hq_sent",
      contactEmail: email,
      contactName: name,
      payload: {
        ...lead,
        packageId: packageId || undefined,
        dealOwner: teamMember || user.name || user.email,
        emailCopy: emailCopy || undefined,
        sentBy: user.email,
      },
    });
  } catch (error) {
    console.error("[hq-sponsor-link] Lead not persisted; continuing to email:", error);
  }

  try {
    const packagesUrl = await sendCompiledSponsorOutreachEmail(email, compiled);
    const base = sponsorOutreachBaseUrl();

    return NextResponse.json({
      success: true,
      packagesUrl,
      checkoutUrl: packageId ? sponsorsCheckoutUrl(packageId, base) : null,
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Sponsor Outreach",
      route: req.nextUrl.pathname,
      provider: "Resend",
      contactEmail: email,
      companyName: company || undefined,
      metadata: { sentBy: user.email, dealOwner: teamMember || undefined },
    });
  }
}, { workflow: "HQ Sponsor Outreach" });
