import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/media-credentials-admin";
import {
  handleApiFailure,
  publicErrorResponse,
  safeApiHandler,
} from "@/lib/errors";
import { listMediaCredentialApplications } from "@/lib/media-credentials-store";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const session = await requireAdminSession(req);
  if (!session.ok) {
    return publicErrorResponse(401);
  }

  try {
    const applications = await listMediaCredentialApplications();
    return NextResponse.json({ success: true, applications });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Media Credentials Admin",
      route: req.nextUrl.pathname,
      provider: "Media Credential Storage",
    });
  }
}, { workflow: "Media Credentials Admin" });
