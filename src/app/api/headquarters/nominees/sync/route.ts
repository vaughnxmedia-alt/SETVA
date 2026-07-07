import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import {
  getNomineeConsistencyReport,
  recoverOrphanPublishedNominees,
} from "@/lib/nominee-consistency-store";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const report = await getNomineeConsistencyReport();
    return NextResponse.json({ success: true, report });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominee Sync",
      route: req.nextUrl.pathname,
      provider: "Nominee Consistency",
    });
  }
}, { workflow: "HQ Nominee Sync" });

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const result = await recoverOrphanPublishedNominees();
    const report = await getNomineeConsistencyReport();
    return NextResponse.json({ success: true, result, report });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominee Sync",
      route: req.nextUrl.pathname,
      provider: "Nominee Consistency",
    });
  }
}, { workflow: "HQ Nominee Sync" });
