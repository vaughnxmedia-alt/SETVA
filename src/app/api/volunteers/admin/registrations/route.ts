import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/media-credentials-admin";
import {
  handleApiFailure,
  publicErrorResponse,
  safeApiHandler,
} from "@/lib/errors";
import { listVolunteerRegistrations } from "@/lib/volunteers-store";
import { volunteerDashboardSummary } from "@/lib/volunteers";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const session = await requireAdminSession(req);
  if (!session.ok) {
    return publicErrorResponse(401);
  }

  try {
    const registrations = await listVolunteerRegistrations();
    return NextResponse.json({
      success: true,
      registrations,
      summary: volunteerDashboardSummary(registrations),
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Volunteer Admin",
      route: req.nextUrl.pathname,
      provider: "Volunteer Storage",
    });
  }
}, { workflow: "Volunteer Admin" });
