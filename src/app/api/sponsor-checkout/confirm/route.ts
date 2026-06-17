import { NextRequest, NextResponse } from "next/server";
import {
  handleApiFailure,
  safeApiHandler,
} from "@/lib/errors";
import { verifyIntakeToken } from "@/lib/sponsor-intake";
import { sendSponsorCheckoutConfirmationEmail } from "@/lib/sponsor-checkout-email";
import { FORM_TYPES } from "@/lib/form-submissions";
import { persistFormSubmission } from "@/lib/persist-form-submission";

export const POST = safeApiHandler(async (req: NextRequest) => {
  let body: { intakeToken?: string; demo?: boolean };
  try {
    body = await req.json();
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Sponsor Checkout Confirmation",
      route: req.nextUrl.pathname,
      metadata: { reason: "invalid_json" },
    }, { status: 400, notifyTeam: false });
  }

  const token = body.intakeToken?.trim();
  if (!token) {
    return handleApiFailure(new Error("Missing intake session"), {
      workflow: "Sponsor Checkout Confirmation",
      route: req.nextUrl.pathname,
      metadata: { reason: "missing_token" },
    }, { status: 400, notifyTeam: false });
  }

  const intake = verifyIntakeToken(token);
  if (!intake) {
    return handleApiFailure(new Error("Invalid or expired intake session"), {
      workflow: "Sponsor Checkout Confirmation",
      route: req.nextUrl.pathname,
      metadata: { reason: "invalid_token" },
    }, { status: 400, notifyTeam: false });
  }

  if (!body.demo) {
    try {
      await persistFormSubmission({
        formType: FORM_TYPES.sponsorCheckoutConfirmed,
        status: "confirmed",
        contactEmail: intake.email,
        contactName: intake.contactName,
        payload: intake,
      });
    } catch (error) {
      return handleApiFailure(error, {
        workflow: "Sponsor Checkout Confirmation",
        route: req.nextUrl.pathname,
        provider: "Database",
        contactEmail: intake.email,
        companyName: intake.companyName,
        metadata: { packageId: intake.packageId },
      });
    }

    try {
      await sendSponsorCheckoutConfirmationEmail(intake);
    } catch (error) {
      return handleApiFailure(error, {
        workflow: "Sponsor Checkout Confirmation",
        route: req.nextUrl.pathname,
        provider: "Resend",
        contactEmail: intake.email,
        companyName: intake.companyName,
        metadata: { packageId: intake.packageId },
      });
    }
  }

  return NextResponse.json({
    success: true,
    packageId: intake.packageId,
    meetingNotes: intake.meetingNotes,
    demo: Boolean(body.demo),
  });
}, {
  workflow: "Sponsor Checkout Confirmation",
});
