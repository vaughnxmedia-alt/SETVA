import { NextRequest, NextResponse } from "next/server";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { parseVolunteerHQInput } from "@/lib/volunteers";
import { listVolunteerRegistrations, saveVolunteerRegistration } from "@/lib/volunteers-store";

function volunteerRecordFromRegistration(reg: Awaited<ReturnType<typeof listVolunteerRegistrations>>[number]) {
  return {
    id: reg.id,
    name: reg.fullName,
    category:
      reg.assignedCategory ||
      reg.volunteerCategories[0]?.replace(" Volunteer", "") ||
      "—",
    role:
      reg.assignedRole ||
      reg.eventDayInterests[0] ||
      reg.preEventInterests[0] ||
      reg.postEventInterests[0] ||
      "—",
    status: reg.status,
  };
}

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const registrations = await listVolunteerRegistrations();
    return NextResponse.json({
      success: true,
      volunteers: registrations.map(volunteerRecordFromRegistration),
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Volunteers",
      route: req.nextUrl.pathname,
      provider: "Volunteer Storage",
    });
  }
}, { workflow: "HQ Volunteers" });

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const parsed = parseVolunteerHQInput(body);
    if ("error" in parsed) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const registration = await saveVolunteerRegistration(parsed.data, { admin: parsed.admin });
    return NextResponse.json({
      success: true,
      volunteer: volunteerRecordFromRegistration(registration),
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Volunteers",
      route: req.nextUrl.pathname,
      provider: "Volunteer Storage",
    });
  }
}, { workflow: "HQ Volunteers" });
