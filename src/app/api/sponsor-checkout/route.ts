import { NextRequest, NextResponse } from "next/server";
import {
  handleApiFailure,
  safeApiHandler,
} from "@/lib/errors";
import {
  createIntakeToken,
  getOfflinePaymentMethod,
  getSponsorPackage,
  parseSponsorIntakeBody,
  paymentUsesSquare,
} from "@/lib/sponsor-intake";
import {
  sendSponsorIntakePendingEmail,
  sendSponsorOfflineConfirmationEmail,
} from "@/lib/sponsor-checkout-email";
import { FORM_TYPES } from "@/lib/form-submissions";
import { persistFormSubmission } from "@/lib/persist-form-submission";
import { createSquarePaymentLink, isSquareConfigured } from "@/lib/square";
import { getPublicSiteUrl } from "@/lib/site-url";

function siteUrl(): string {
  return getPublicSiteUrl();
}

export const POST = safeApiHandler(async (req: NextRequest) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Sponsor Checkout",
      route: req.nextUrl.pathname,
      provider: "Sponsor Checkout API",
      metadata: { reason: "invalid_json" },
    }, { status: 400, notifyTeam: false });
  }

  const parsed = parseSponsorIntakeBody(body);
  if ("error" in parsed) {
    return handleApiFailure(new Error(parsed.error), {
      workflow: "Sponsor Checkout",
      route: req.nextUrl.pathname,
      provider: "Sponsor Intake",
      metadata: { packageId: body.packageId },
    }, { status: 400, notifyTeam: false });
  }

  const intake = parsed.data;
  const pkg = getSponsorPackage(intake.packageId);
  if (!pkg) {
    return handleApiFailure(new Error("Invalid package"), {
      workflow: "Sponsor Checkout",
      route: req.nextUrl.pathname,
      provider: "Sponsor Intake",
      metadata: { packageId: intake.packageId },
    }, { status: 400, notifyTeam: false });
  }

  let intakeToken: string;
  try {
    intakeToken = createIntakeToken(intake);
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Sponsor Checkout",
      route: req.nextUrl.pathname,
      provider: "Sponsor Intake",
      contactEmail: intake.email,
      companyName: intake.companyName,
    });
  }

  const base = siteUrl();
  const offlineMethod = getOfflinePaymentMethod(intake.preferredPayment);

  try {
    await persistFormSubmission({
      formType: FORM_TYPES.sponsorIntake,
      status: offlineMethod ? "offline_pending" : "checkout_pending",
      contactEmail: intake.email,
      contactName: intake.contactName,
      payload: {
        ...intake,
        packageName: pkg.name,
        packagePrice: pkg.price,
      },
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Sponsor Checkout",
      route: req.nextUrl.pathname,
      provider: "Database",
      contactEmail: intake.email,
      companyName: intake.companyName,
      metadata: { packageId: intake.packageId },
    });
  }

  try {
    await sendSponsorIntakePendingEmail({
      ...intake,
      submittedAt: Date.now(),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Sponsor Checkout",
      route: req.nextUrl.pathname,
      provider: "Resend",
      contactEmail: intake.email,
      companyName: intake.companyName,
      metadata: { step: "intake_pending_email" },
    });
  }

  if (offlineMethod) {
    try {
      await sendSponsorOfflineConfirmationEmail({
        ...intake,
        submittedAt: Date.now(),
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
    } catch (error) {
      return handleApiFailure(error, {
        workflow: "Sponsor Checkout",
        route: req.nextUrl.pathname,
        provider: "Resend",
        contactEmail: intake.email,
        companyName: intake.companyName,
        metadata: { step: "offline_confirmation_email", method: offlineMethod },
      });
    }

    return NextResponse.json({
      success: true,
      url: `${base}/sponsors/checkout/complete?method=${offlineMethod}`,
      intakeToken,
      offline: true,
      method: offlineMethod,
    });
  }

  if (!paymentUsesSquare(intake.preferredPayment)) {
    return handleApiFailure(new Error("Unsupported payment option"), {
      workflow: "Sponsor Checkout",
      route: req.nextUrl.pathname,
      provider: "Sponsor Intake",
      contactEmail: intake.email,
      metadata: { preferredPayment: intake.preferredPayment },
    }, { status: 400, notifyTeam: false });
  }

  if (!isSquareConfigured()) {
    return handleApiFailure(new Error("Square checkout is not configured"), {
      workflow: "Sponsor Checkout",
      route: req.nextUrl.pathname,
      provider: "Square",
      contactEmail: intake.email,
      companyName: intake.companyName,
      metadata: { packageId: intake.packageId },
    }, { status: 503, notifyTeam: false });
  }

  try {
    const url = await createSquarePaymentLink({
      name: `SETVA Sponsor — ${pkg.name}`,
      description: `${intake.companyName} · ${intake.contactName}`,
      amountCents: pkg.price * 100,
      quantity: 1,
      paymentNote: `SETVA sponsor intake:${intake.packageId}:${intake.email}`.slice(
        0,
        500,
      ),
      redirectUrl: `${base}/sponsors/checkout/complete`,
    });

    return NextResponse.json({ success: true, url, intakeToken });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Sponsor Checkout",
      route: req.nextUrl.pathname,
      provider: "Square",
      contactEmail: intake.email,
      companyName: intake.companyName,
      metadata: { packageId: intake.packageId },
    });
  }
}, { workflow: "Sponsor Checkout" });
