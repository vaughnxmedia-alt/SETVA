import { NextRequest, NextResponse } from "next/server";
import { sendSponsorDeckEmail } from "@/lib/email";
import {
  handleApiFailure,
  safeApiHandler,
} from "@/lib/errors";
import { FORM_TYPES } from "@/lib/form-submissions";
import { persistFormSubmission } from "@/lib/persist-form-submission";

type SponsorDeckBody = {
  name?: string;
  email?: string;
  company?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export const POST = safeApiHandler(async (req: NextRequest) => {
  let body: SponsorDeckBody;
  try {
    body = await req.json();
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Sponsor Deck Request",
      route: req.nextUrl.pathname,
      provider: "Resend",
      metadata: { reason: "invalid_json" },
    }, { status: 400, notifyTeam: false });
  }

  const name = normalizeText(body.name, 120);
  const email = normalizeText(body.email, 254).toLowerCase();
  const company = normalizeText(body.company, 160);

  if (!name) {
    return handleApiFailure(new Error("Name is required"), {
      workflow: "Sponsor Deck Request",
      route: req.nextUrl.pathname,
      provider: "Resend",
      metadata: { reason: "missing_name" },
    }, { status: 400, notifyTeam: false });
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    return handleApiFailure(new Error("Invalid email"), {
      workflow: "Sponsor Deck Request",
      route: req.nextUrl.pathname,
      provider: "Resend",
      metadata: { reason: "invalid_email" },
    }, { status: 400, notifyTeam: false });
  }

  const lead = { name, email, company: company || undefined };
  let packagesUrl: string;

  try {
    await persistFormSubmission({
      formType: FORM_TYPES.sponsorDeck,
      status: "received",
      contactEmail: email,
      contactName: name,
      payload: lead,
    });
  } catch (error) {
    console.error("[sponsor-deck] Lead not persisted; continuing to email:", error);
  }

  try {
    packagesUrl = await sendSponsorDeckEmail(lead);
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Sponsor Deck Request",
      route: req.nextUrl.pathname,
      provider: "Resend",
      contactEmail: email,
      companyName: company || undefined,
    });
  }

  return NextResponse.json({
    success: true,
    packagesUrl,
  });
}, { workflow: "Sponsor Deck Request" });
