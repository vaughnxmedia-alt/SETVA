import { NextRequest, NextResponse } from "next/server";
import { compileMediaCredentialApprovalConfirmationEmail } from "@/lib/media-credential-approval-email";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { getMediaCredentialApplication } from "@/lib/media-credentials-store";

export async function POST(req: NextRequest) {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const applicationId = String(body.applicationId ?? "").trim();
  const checkInTime = String(body.checkInTime ?? "").trim();
  const checkInLocation = String(body.checkInLocation ?? "").trim();

  if (!applicationId) {
    return NextResponse.json({ success: false, error: "Application is required." }, { status: 400 });
  }

  const application = await getMediaCredentialApplication(applicationId);
  if (!application) {
    return NextResponse.json({ success: false, error: "Application not found." }, { status: 404 });
  }

  const compiled = compileMediaCredentialApprovalConfirmationEmail({
    application: {
      id: application.id,
      fullName: application.fullName,
      email: application.email,
      mediaOutlet: application.mediaOutlet,
      teamMemberRoster: application.teamMemberRoster ?? [],
    },
    checkInTime,
    checkInLocation,
  });

  return NextResponse.json({
    success: true,
    subject: compiled.subject,
    html: compiled.html,
    plainText: compiled.plainText,
  });
}
