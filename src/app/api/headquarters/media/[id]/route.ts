import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { applicationStatusOptions, type ApplicationStatus } from "@/lib/media-credentials";
import {
  sendMediaCredentialApprovalConfirmationEmail,
  sendMediaCredentialStatusEmail,
} from "@/lib/media-credentials-email";
import {
  deleteMediaCredentialApplication,
  getMediaCredentialApplication,
  updateMediaCredentialApplication,
} from "@/lib/media-credentials-store";

function idFromPath(pathname: string): string {
  return pathname.split("/").pop() ?? "";
}

export const PATCH = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  const id = idFromPath(req.nextUrl.pathname);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const status = String(body.status ?? "").trim();
  if (!applicationStatusOptions.includes(status as ApplicationStatus)) {
    return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
  }

  const sendEmail = body.sendEmail === true;
  const checkInTime = String(body.checkInTime ?? "").trim();
  const checkInLocation = String(body.checkInLocation ?? "").trim();

  try {
    const current = await getMediaCredentialApplication(id);
    if (!current) {
      return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
    }

    const previousStatus = current.status;
    const isApproval = status === "Approved" || status === "Approved with Restrictions";

    const updated = await updateMediaCredentialApplication(id, {
      admin: {
        status: status as ApplicationStatus,
        ...(checkInLocation ? { pickupLocation: checkInLocation } : {}),
        ...(checkInTime ? { arrivalTime: checkInTime } : {}),
      },
    });
    if (!updated) {
      return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
    }

    if (sendEmail) {
      if (isApproval) {
        await sendMediaCredentialApprovalConfirmationEmail(updated, { checkInTime, checkInLocation });
      } else {
        await sendMediaCredentialStatusEmail(updated, previousStatus);
      }
      const emailed = await updateMediaCredentialApplication(id, {
        lastStatusEmailAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, application: emailed ?? updated, emailed: true });
    }

    return NextResponse.json({ success: true, application: updated, emailed: false });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Media Credentials",
      route: req.nextUrl.pathname,
      provider: "Media Credential Storage",
      metadata: { applicationId: id },
    });
  }
}, { workflow: "HQ Media Credentials" });

export const DELETE = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  const id = idFromPath(req.nextUrl.pathname);

  try {
    const deleted = await deleteMediaCredentialApplication(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Media Credentials",
      route: req.nextUrl.pathname,
      provider: "Media Credential Storage",
      metadata: { applicationId: id },
    });
  }
}, { workflow: "HQ Media Credentials" });
