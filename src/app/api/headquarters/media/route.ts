import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { listMediaCredentialApplications } from "@/lib/media-credentials-store";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const applications = await listMediaCredentialApplications();
    return NextResponse.json({ success: true, applications });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Media Credentials",
      route: req.nextUrl.pathname,
      provider: "Media Credential Storage",
    });
  }
}, { workflow: "HQ Media Credentials" });
