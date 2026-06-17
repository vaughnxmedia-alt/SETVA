import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { parseVolunteerBody } from "@/lib/volunteers";
import {
  sendVolunteerConfirmationEmail,
  sendVolunteerTeamNotification,
} from "@/lib/volunteers-email";
import { saveVolunteerRegistration } from "@/lib/volunteers-store";

export const POST = safeApiHandler(async (req: NextRequest) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Volunteer Registration",
      route: req.nextUrl.pathname,
      provider: "Volunteer Intake",
      metadata: { reason: "invalid_json" },
    }, { status: 400, notifyTeam: false });
  }

  const parsed = parseVolunteerBody(body);
  if ("error" in parsed) {
    return handleApiFailure(new Error(parsed.error), {
      workflow: "Volunteer Registration",
      route: req.nextUrl.pathname,
      provider: "Volunteer Intake",
      metadata: { reason: "validation" },
    }, { status: 400, notifyTeam: false });
  }

  let registration;
  try {
    registration = await saveVolunteerRegistration(parsed.data);
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Volunteer Registration",
      route: req.nextUrl.pathname,
      provider: "Volunteer Storage",
      contactEmail: parsed.data.email,
      metadata: { applicant: parsed.data.fullName },
    });
  }

  try {
    await Promise.all([
      sendVolunteerConfirmationEmail(registration),
      sendVolunteerTeamNotification(registration),
    ]);
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Volunteer Registration",
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
}, { workflow: "Volunteer Registration" });
