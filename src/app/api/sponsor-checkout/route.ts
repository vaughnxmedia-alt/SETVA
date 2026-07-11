import { NextRequest, NextResponse } from "next/server";
import {
  handleApiFailure,
  safeApiHandler,
} from "@/lib/errors";
import {
  createIntakeToken,
  getSponsorPackage,
  parseSponsorIntakeBody,
  paymentUsesSquare,
} from "@/lib/sponsor-intake";
import { sendSponsorIntakePendingEmail } from "@/lib/sponsor-checkout-email";
import { FORM_TYPES } from "@/lib/form-submissions";
import { categoryIsSpecialAward } from "@/lib/nominee-category-groups";
import { listPublishedNomineePageCategories } from "@/lib/nominee-workflows-store";
import { persistFormSubmission } from "@/lib/persist-form-submission";
import { writeSponsorAsset } from "@/lib/sponsor-assets";
import { createSquarePaymentLink, isSquareConfigured } from "@/lib/square";
import { getPublicSiteUrl } from "@/lib/site-url";

function siteUrl(): string {
  return getPublicSiteUrl();
}

async function parseSponsorCheckoutRequest(req: NextRequest): Promise<{
  body: Record<string, unknown>;
  logoFile: File | null;
  videoAdFile: File | null;
}> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return {
      body: (await req.json()) as Record<string, unknown>,
      logoFile: null,
      videoAdFile: null,
    };
  }

  const formData = await req.formData();
  const payload = String(formData.get("payload") ?? "");
  const body = payload ? (JSON.parse(payload) as Record<string, unknown>) : {};
  const logo = formData.get("logo");
  const videoAd = formData.get("videoAd");

  return {
    body,
    logoFile: logo instanceof File && logo.size > 0 ? logo : null,
    videoAdFile: videoAd instanceof File && videoAd.size > 0 ? videoAd : null,
  };
}

export const POST = safeApiHandler(async (req: NextRequest) => {
  let body: Record<string, unknown>;
  let logoFile: File | null = null;
  let videoAdFile: File | null = null;
  try {
    const parsedRequest = await parseSponsorCheckoutRequest(req);
    body = parsedRequest.body;
    logoFile = parsedRequest.logoFile;
    videoAdFile = parsedRequest.videoAdFile;
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

  if (intake.packageId === "category-sponsor") {
    const categories = await listPublishedNomineePageCategories();
    const category = categories.find(
      (item) =>
        item.id === intake.categorySponsorshipCategoryId &&
        !categoryIsSpecialAward(item),
    );
    if (!category) {
      return handleApiFailure(new Error("Invalid category sponsorship selection"), {
        workflow: "Sponsor Checkout",
        route: req.nextUrl.pathname,
        provider: "Sponsor Intake",
        contactEmail: intake.email,
        companyName: intake.companyName,
        metadata: { categoryId: intake.categorySponsorshipCategoryId },
      }, { status: 400, notifyTeam: false });
    }
    intake.categorySponsorshipCategoryTitle = category.title;
  }

  if (!logoFile) {
    return handleApiFailure(new Error("Sponsor logo is required"), {
      workflow: "Sponsor Checkout",
      route: req.nextUrl.pathname,
      provider: "Sponsor Asset Upload",
      contactEmail: intake.email,
      companyName: intake.companyName,
      metadata: { packageId: intake.packageId },
    }, { status: 400, notifyTeam: false });
  }

  try {
    if (logoFile) {
      const stored = await writeSponsorAsset({
        kind: "logo",
        companyName: intake.companyName,
        packageId: intake.packageId,
        originalName: logoFile.name,
        buffer: Buffer.from(await logoFile.arrayBuffer()),
      });
      intake.logoAssetUrl = stored.url;
      intake.logoAssetName = stored.originalName;
    }

    if (videoAdFile) {
      const stored = await writeSponsorAsset({
        kind: "video-ad",
        companyName: intake.companyName,
        packageId: intake.packageId,
        originalName: videoAdFile.name,
        buffer: Buffer.from(await videoAdFile.arrayBuffer()),
      });
      intake.videoAdAssetUrl = stored.url;
      intake.videoAdAssetName = stored.originalName;
    }
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Sponsor Checkout",
      route: req.nextUrl.pathname,
      provider: "Sponsor Asset Upload",
      contactEmail: intake.email,
      companyName: intake.companyName,
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

  try {
    await persistFormSubmission({
      formType: FORM_TYPES.sponsorIntake,
      status: "checkout_pending",
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
