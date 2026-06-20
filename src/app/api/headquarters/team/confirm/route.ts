import { NextRequest, NextResponse } from "next/server";
import { sendHQApprovalEmail } from "@/lib/hq-team/email";
import { verifyHQTeamToken } from "@/lib/hq-team/tokens";
import { approveHQTeamAccessRequest } from "@/lib/hq-team/store";
import { siteUrl } from "@/lib/sponsor-deck";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
  const payload = verifyHQTeamToken(token, "approve");
  if (!payload) {
    return NextResponse.redirect(`${siteUrl()}/headquarters/team/confirm?status=invalid`);
  }

  try {
    const member = await approveHQTeamAccessRequest(payload.email);
    const activateUrl = `${siteUrl()}/headquarters/activate?email=${encodeURIComponent(member.email)}`;

    await sendHQApprovalEmail({
      name: member.name,
      email: member.email,
      setvaId: member.setvaId,
      activateUrl,
    });

    return NextResponse.redirect(
      `${siteUrl()}/headquarters/team/confirm?status=approved&name=${encodeURIComponent(member.name)}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "confirm_failed";
    return NextResponse.redirect(
      `${siteUrl()}/headquarters/team/confirm?status=error&message=${encodeURIComponent(message)}`,
    );
  }
}
