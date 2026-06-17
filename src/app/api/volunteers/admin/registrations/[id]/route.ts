import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/media-credentials-admin";
import { parseVolunteerAdminUpdate } from "@/lib/volunteers";
import { sendVolunteerStatusEmail } from "@/lib/volunteers-email";
import {
  getVolunteerRegistration,
  updateVolunteerRegistration,
} from "@/lib/volunteers-store";
import {
  handleApiFailure,
  publicErrorResponse,
  safeApiHandler,
} from "@/lib/errors";

function registrationIdFromPath(pathname: string): string {
  return pathname.split("/").pop() ?? "";
}

async function getRegistrationHandler(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session.ok) return publicErrorResponse(401);

  const id = registrationIdFromPath(req.nextUrl.pathname);

  try {
    const registration = await getVolunteerRegistration(id);
    if (!registration) {
      return handleApiFailure(new Error("Registration not found"), {
        workflow: "Volunteer Admin",
        route: req.nextUrl.pathname,
        provider: "Volunteer Storage",
        metadata: { registrationId: id },
      }, { status: 404, notifyTeam: false });
    }

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Volunteer Admin",
      route: req.nextUrl.pathname,
      provider: "Volunteer Storage",
      metadata: { registrationId: id },
    });
  }
}

async function patchRegistrationHandler(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session.ok) return publicErrorResponse(401);

  const id = registrationIdFromPath(req.nextUrl.pathname);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Volunteer Admin",
      route: req.nextUrl.pathname,
      provider: "Volunteer Admin Update",
      metadata: { registrationId: id, reason: "invalid_json" },
    }, { status: 400, notifyTeam: false });
  }

  const sendStatusEmail = body.sendStatusEmail === true;

  try {
    const current = await getVolunteerRegistration(id);
    if (!current) {
      return handleApiFailure(new Error("Registration not found"), {
        workflow: "Volunteer Admin",
        route: req.nextUrl.pathname,
        provider: "Volunteer Storage",
        metadata: { registrationId: id },
      }, { status: 404, notifyTeam: false });
    }

    const { admin, postEvent } = parseVolunteerAdminUpdate(body);
    const previousStatus = current.status;

    const updated = await updateVolunteerRegistration(id, { admin, postEvent });
    if (!updated) {
      return handleApiFailure(new Error("Registration not found"), {
        workflow: "Volunteer Admin",
        route: req.nextUrl.pathname,
        provider: "Volunteer Storage",
        metadata: { registrationId: id },
      }, { status: 404, notifyTeam: false });
    }

    if (sendStatusEmail && updated.status !== previousStatus) {
      await sendVolunteerStatusEmail(updated, previousStatus);
      const emailed = await updateVolunteerRegistration(id, {
        lastStatusEmailAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, registration: emailed ?? updated });
    }

    return NextResponse.json({ success: true, registration: updated });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Volunteer Admin",
      route: req.nextUrl.pathname,
      provider: "Volunteer Storage",
      metadata: { registrationId: id },
    });
  }
}

export const GET = safeApiHandler(getRegistrationHandler, { workflow: "Volunteer Admin" });
export const PATCH = safeApiHandler(patchRegistrationHandler, { workflow: "Volunteer Admin" });
