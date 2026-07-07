import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  HQ_SESSION_EXPIRED_CODE,
  HQ_SESSION_EXPIRED_MESSAGE,
} from "@/lib/headquarters/api-auth.constants";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import type { HQUser } from "@/lib/headquarters/auth";

export { HQ_SESSION_EXPIRED_CODE, HQ_SESSION_EXPIRED_MESSAGE };

/** Clear 401 for HQ API routes — all active team members have equal access. */
export function hqUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message: HQ_SESSION_EXPIRED_MESSAGE,
      code: HQ_SESSION_EXPIRED_CODE,
    },
    { status: 401 },
  );
}

export async function requireHQUser(
  req: NextRequest,
): Promise<{ user: HQUser } | NextResponse> {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();
  return { user };
}
