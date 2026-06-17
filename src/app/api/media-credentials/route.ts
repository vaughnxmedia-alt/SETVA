import { NextRequest, NextResponse } from "next/server";
import {
  handleApiFailure,
  safeApiHandler,
} from "@/lib/errors";
import { parseMediaCredentialBody } from "@/lib/media-credentials";
import {
  sendMediaCredentialConfirmationEmail,
  sendMediaCredentialTeamNotification,
} from "@/lib/media-credentials-email";
import { saveMediaCredentialApplication } from "@/lib/media-credentials-store";

export const POST = safeApiHandler(async (req: NextRequest) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Media Credentials",
      route: req.nextUrl.pathname,
      provider: "Media Credential Intake",
      metadata: { reason: "invalid_json" },
    }, { status: 400, notifyTeam: false });
  }

  const parsed = parseMediaCredentialBody(body);
  if ("error" in parsed) {
    return handleApiFailure(new Error(parsed.error), {
      workflow: "Media Credentials",
      route: req.nextUrl.pathname,
      provider: "Media Credential Intake",
      metadata: { reason: "validation" },
    }, { status: 400, notifyTeam: false });
  }

  let application;
  try {
    application = await saveMediaCredentialApplication(parsed.data);
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Media Credentials",
      route: req.nextUrl.pathname,
      provider: "Media Credential Storage",
      contactEmail: parsed.data.email,
      metadata: { applicant: parsed.data.fullName },
    });
  }

  try {
    await Promise.all([
      sendMediaCredentialConfirmationEmail(application),
      sendMediaCredentialTeamNotification(application),
    ]);
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Media Credentials",
      route: req.nextUrl.pathname,
      provider: "Resend",
      contactEmail: application.email,
      metadata: { applicationId: application.id },
    });
  }

  return NextResponse.json({
    success: true,
    demo: !process.env.RESEND_API_KEY?.trim(),
  });
}, { workflow: "Media Credentials" });
