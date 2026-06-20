import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import {
  sendHQAccessRequestEmail,
  sendHQRequestReceivedEmail,
} from "@/lib/hq-team/email";
import { createHQTeamToken } from "@/lib/hq-team/tokens";
import { createHQTeamAccessRequest } from "@/lib/hq-team/store";
import { siteUrl } from "@/lib/sponsor-deck";

type RequestBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = safeApiHandler(async (req: NextRequest) => {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Access Request",
      route: req.nextUrl.pathname,
      metadata: { reason: "invalid_json" },
    }, { status: 400, notifyTeam: false });
  }

  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const name = `${firstName} ${lastName}`.trim();

  if (!firstName || !lastName || !email || !EMAIL_PATTERN.test(email)) {
    return handleApiFailure(new Error("First name, last name, and a valid email are required."), {
      workflow: "HQ Access Request",
      route: req.nextUrl.pathname,
      metadata: { reason: "validation" },
    }, { status: 400, notifyTeam: false });
  }

  try {
    await createHQTeamAccessRequest({ firstName, lastName, email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit request.";
    return handleApiFailure(new Error(message), {
      workflow: "HQ Access Request",
      route: req.nextUrl.pathname,
      contactEmail: email,
      metadata: { applicant: name },
    }, { status: 400, notifyTeam: false });
  }

  const token = createHQTeamToken("approve", email);
  const confirmUrl = `${siteUrl()}/api/headquarters/team/confirm?token=${encodeURIComponent(token)}`;

  try {
    await Promise.all([
      sendHQAccessRequestEmail({ name, email, confirmUrl }),
      sendHQRequestReceivedEmail({ name, email }),
    ]);
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Access Request",
      route: req.nextUrl.pathname,
      provider: "Resend",
      contactEmail: email,
      metadata: { applicant: name },
    });
  }

  return NextResponse.json({
    ok: true,
    demo: !process.env.RESEND_API_KEY?.trim(),
  });
}, { workflow: "HQ Access Request" });
