import { NextRequest, NextResponse } from "next/server";
import {
  adminCookieName,
  adminSessionCookieOptions,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/media-credentials-admin";
import {
  handleApiFailure,
  safeApiHandler,
} from "@/lib/errors";

export const POST = safeApiHandler(async (req: NextRequest) => {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Media Credentials Admin",
      route: req.nextUrl.pathname,
      provider: "Admin Session",
      metadata: { reason: "invalid_json" },
    }, { status: 400, notifyTeam: false });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!verifyAdminPassword(password)) {
    return handleApiFailure(new Error("Invalid admin password"), {
      workflow: "Media Credentials Admin",
      route: req.nextUrl.pathname,
      provider: "Admin Session",
      metadata: { reason: "invalid_password" },
    }, { status: 401, notifyTeam: false });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(
    adminCookieName(),
    createAdminSessionToken(),
    adminSessionCookieOptions(),
  );
  return response;
}, { workflow: "Media Credentials Admin" });

export const DELETE = safeApiHandler(async () => {
  const response = NextResponse.json({ success: true });
  response.cookies.set(adminCookieName(), "", {
    ...adminSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}, { workflow: "Media Credentials Admin" });
