import { NextRequest, NextResponse } from "next/server";
import { ambassadorStatusOptions } from "@/lib/ambassadors";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { getHQAmbassadors } from "@/lib/headquarters/data";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";
import { updateAmbassadorRegistration } from "@/lib/ambassadors-store";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const ambassadors = await getHQAmbassadors();
    return NextResponse.json({ success: true, ambassadors });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Ambassadors",
      route: req.nextUrl.pathname,
      provider: "Ambassador Storage",
    });
  }
}, { workflow: "HQ Ambassadors" });

export const PATCH = safeApiHandler(async (req: NextRequest) => {
  // Any authenticated Headquarters user can review ambassador applications.
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const body = (await req.json()) as {
      id?: string;
      status?: string;
      internalNotes?: string;
    };
    const id = body.id?.trim() ?? "";
    if (!id) {
      return NextResponse.json({ success: false, error: "Ambassador id is required." }, { status: 400 });
    }

    const status = body.status?.trim() ?? "";
    if (status && !ambassadorStatusOptions.includes(status as (typeof ambassadorStatusOptions)[number])) {
      return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
    }

    const reviewedAt = status ? new Date().toISOString() : undefined;
    const updated = await updateAmbassadorRegistration(id, {
      admin: {
        ...(status ? { status: status as (typeof ambassadorStatusOptions)[number] } : {}),
        ...(body.internalNotes !== undefined ? { internalNotes: body.internalNotes } : {}),
        ...(status
          ? {
              reviewedByName: user.name,
              reviewedByEmail: user.email,
              reviewedAt: reviewedAt ?? new Date().toISOString(),
            }
          : {}),
      },
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Ambassador not found." }, { status: 404 });
    }

    const ambassadors = await getHQAmbassadors();
    const ambassador = ambassadors.find((item) => item.id === id);
    return NextResponse.json({ success: true, ambassador });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Ambassadors",
      route: req.nextUrl.pathname,
      provider: "Ambassador Storage",
    });
  }
}, { workflow: "HQ Ambassadors" });
