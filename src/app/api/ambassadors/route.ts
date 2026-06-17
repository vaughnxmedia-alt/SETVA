import { NextRequest, NextResponse } from "next/server";
import { parseAmbassadorBody } from "@/lib/ambassadors";
import {
  sendAmbassadorConfirmationEmail,
  sendAmbassadorTeamNotification,
} from "@/lib/ambassadors-email";
import { saveAmbassadorRegistration } from "@/lib/ambassadors-store";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";

export const POST = safeApiHandler(async (req: NextRequest) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Ambassador Registration",
      route: req.nextUrl.pathname,
      provider: "Ambassador Intake",
      metadata: { reason: "invalid_json" },
    }, { status: 400, notifyTeam: false });
  }

  const parsed = parseAmbassadorBody(body);
  if ("error" in parsed) {
    return handleApiFailure(new Error(parsed.error), {
      workflow: "Ambassador Registration",
      route: req.nextUrl.pathname,
      provider: "Ambassador Intake",
      metadata: { reason: "validation" },
    }, { status: 400, notifyTeam: false });
  }

  let registration;
  try {
    registration = await saveAmbassadorRegistration(parsed.data);
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Ambassador Registration",
      route: req.nextUrl.pathname,
      provider: "Ambassador Storage",
      contactEmail: parsed.data.email,
      metadata: { applicant: parsed.data.fullName },
    });
  }

  try {
    await Promise.all([
      sendAmbassadorConfirmationEmail(registration),
      sendAmbassadorTeamNotification(registration),
    ]);
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Ambassador Registration",
      route: req.nextUrl.pathname,
      provider: "Resend",
      contactEmail: registration.email,
      metadata: { registrationId: registration.id },
    });
  }

  return NextResponse.json({
    success: true,
    demo: !process.env.RESEND_API_KEY?.trim(),
  });
}, { workflow: "Ambassador Registration" });
