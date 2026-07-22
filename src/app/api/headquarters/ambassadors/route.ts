import { NextRequest, NextResponse } from "next/server";
import { ambassadorStatusOptions } from "@/lib/ambassadors";
import { sendAmbassadorStatusEmail } from "@/lib/ambassadors-email";
import {
  getAmbassadorRegistration,
  updateAmbassadorRegistration,
} from "@/lib/ambassadors-store";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { getHQAmbassadorById, getHQAmbassadors } from "@/lib/headquarters/data";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

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
  if (!user) return hqUnauthorizedResponse();

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

    const current = await getAmbassadorRegistration(id);
    if (!current) {
      return NextResponse.json({ success: false, error: "Ambassador not found." }, { status: 404 });
    }
    const previousStatus = current.status;

    const reviewedAt = status ? new Date().toISOString() : undefined;
    let updated = await updateAmbassadorRegistration(id, {
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

    let emailed = false;
    let emailError: string | null = null;
    try {
      await sendAmbassadorStatusEmail(updated, previousStatus);
      const approvedStatuses = new Set(["Approved", "Active"]);
      if (approvedStatuses.has(updated.status) && !approvedStatuses.has(previousStatus)) {
        updated =
          (await updateAmbassadorRegistration(id, {
            lastStatusEmailAt: new Date().toISOString(),
          })) ?? updated;
        emailed = true;
      }
    } catch (err) {
      console.error("[HQ Ambassadors] approval email failed", err);
      emailError =
        err instanceof Error
          ? err.message
          : "Ambassador was updated, but the approval email could not be sent.";
    }

    // Lightweight response — do not reload all ticket-link events.
    const ambassador = await getHQAmbassadorById(updated.id);
    return NextResponse.json({
      success: true,
      ambassador: ambassador ?? undefined,
      emailed,
      emailError,
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Ambassadors",
      route: req.nextUrl.pathname,
      provider: "Ambassador Storage",
    });
  }
}, { workflow: "HQ Ambassadors" });
