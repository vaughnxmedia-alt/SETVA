import { NextRequest, NextResponse } from "next/server";
import { verifyMediaCredentialAccessToken } from "@/lib/media-credential-access";
import { parseMediaCredentialTeamMemberBody } from "@/lib/media-credential-team";
import { saveMediaCredentialTeamMember } from "@/lib/media-credential-team-store";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { getMediaCredentialApplication } from "@/lib/media-credentials-store";

function readAccess(req: NextRequest): {
  applicationId: string;
  access: string;
} | null {
  const applicationId = req.nextUrl.searchParams.get("application")?.trim() ?? "";
  const access = req.nextUrl.searchParams.get("access")?.trim() ?? "";
  if (!applicationId || !access) return null;
  return { applicationId, access };
}

async function loadAuthorizedApplication(req: NextRequest) {
  const params = readAccess(req);
  if (!params) return { error: "Invalid or missing access link." as const };

  const token = verifyMediaCredentialAccessToken(params.access);
  if (!token || token.applicationId !== params.applicationId) {
    return { error: "This team registration link is invalid or has expired." as const };
  }

  const application = await getMediaCredentialApplication(params.applicationId);
  if (!application) {
    return { error: "Media credential application not found." as const };
  }

  if (token.email !== application.email.toLowerCase()) {
    return { error: "This team registration link is invalid or has expired." as const };
  }

  return { application, token };
}

export const GET = safeApiHandler(async (req: NextRequest) => {
  const result = await loadAuthorizedApplication(req);
  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    applicationId: result.application.id,
    mediaOutlet: result.application.mediaOutlet,
    applicantName: result.application.fullName,
    teamMemberRoster: result.application.teamMemberRoster ?? [],
  });
}, { workflow: "Media Team Registration" });

export const POST = safeApiHandler(async (req: NextRequest) => {
  const result = await loadAuthorizedApplication(req);
  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseMediaCredentialTeamMemberBody(body, result.application.id);
  if ("error" in parsed) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  try {
    const record = await saveMediaCredentialTeamMember({
      data: {
        ...parsed.data,
        mediaOutlet: result.application.mediaOutlet,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Media Team Registration",
      route: req.nextUrl.pathname,
      provider: "Media Credential Storage",
      contactEmail: parsed.data.email,
      metadata: { applicationId: result.application.id },
    });
  }
}, { workflow: "Media Team Registration" });
