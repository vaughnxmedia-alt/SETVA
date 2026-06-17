import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/media-credentials-admin";
import { parseMediaCredentialAdminUpdate } from "@/lib/media-credentials";
import { sendMediaCredentialStatusEmail } from "@/lib/media-credentials-email";
import {
  getMediaCredentialApplication,
  updateMediaCredentialApplication,
} from "@/lib/media-credentials-store";
import {
  handleApiFailure,
  publicErrorResponse,
  safeApiHandler,
} from "@/lib/errors";

function applicationIdFromPath(pathname: string): string {
  return pathname.split("/").pop() ?? "";
}

async function getApplicationHandler(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session.ok) {
    return publicErrorResponse(401);
  }

  const id = applicationIdFromPath(req.nextUrl.pathname);

  try {
    const application = await getMediaCredentialApplication(id);
    if (!application) {
      return handleApiFailure(new Error("Application not found"), {
        workflow: "Media Credentials Admin",
        route: req.nextUrl.pathname,
        provider: "Media Credential Storage",
        metadata: { applicationId: id },
      }, { status: 404, notifyTeam: false });
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Media Credentials Admin",
      route: req.nextUrl.pathname,
      provider: "Media Credential Storage",
      metadata: { applicationId: id },
    });
  }
}

async function patchApplicationHandler(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session.ok) {
    return publicErrorResponse(401);
  }

  const id = applicationIdFromPath(req.nextUrl.pathname);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Media Credentials Admin",
      route: req.nextUrl.pathname,
      provider: "Media Credential Admin Update",
      metadata: { applicationId: id, reason: "invalid_json" },
    }, { status: 400, notifyTeam: false });
  }

  const sendStatusEmail = body.sendStatusEmail === true;

  try {
    const current = await getMediaCredentialApplication(id);
    if (!current) {
      return handleApiFailure(new Error("Application not found"), {
        workflow: "Media Credentials Admin",
        route: req.nextUrl.pathname,
        provider: "Media Credential Storage",
        metadata: { applicationId: id },
      }, { status: 404, notifyTeam: false });
    }

    const { admin, postEvent } = parseMediaCredentialAdminUpdate(body);
    const previousStatus = current.status;

    const updated = await updateMediaCredentialApplication(id, { admin, postEvent });
    if (!updated) {
      return handleApiFailure(new Error("Application not found"), {
        workflow: "Media Credentials Admin",
        route: req.nextUrl.pathname,
        provider: "Media Credential Storage",
        metadata: { applicationId: id },
      }, { status: 404, notifyTeam: false });
    }

    if (sendStatusEmail && updated.status !== previousStatus) {
      await sendMediaCredentialStatusEmail(updated, previousStatus);
      const emailed = await updateMediaCredentialApplication(id, {
        lastStatusEmailAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, application: emailed ?? updated });
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Media Credentials Admin",
      route: req.nextUrl.pathname,
      provider: "Media Credential Storage",
      metadata: { applicationId: id },
    });
  }
}

export const GET = safeApiHandler(getApplicationHandler, {
  workflow: "Media Credentials Admin",
});

export const PATCH = safeApiHandler(patchApplicationHandler, {
  workflow: "Media Credentials Admin",
});
