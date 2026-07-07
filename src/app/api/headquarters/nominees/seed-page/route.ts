import { NextRequest, NextResponse } from "next/server";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { seedPublicPageNominees } from "@/lib/nominee-page-seed-store";

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const result = await seedPublicPageNominees({ name: user.name, email: user.email });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominees Seed Page",
      route: req.nextUrl.pathname,
      provider: "Nominee Storage",
    });
  }
}, { workflow: "HQ Nominees Seed Page" });
