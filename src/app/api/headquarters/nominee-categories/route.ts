import { NextRequest, NextResponse } from "next/server";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { listNomineeCategories, saveNomineeCategories } from "@/lib/nominee-categories-store";
import { parseNomineeCategories } from "@/lib/nominees";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const categories = await listNomineeCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominee Categories",
      route: req.nextUrl.pathname,
      provider: "Nominee Storage",
    });
  }
}, { workflow: "HQ Nominee Categories" });

export const PUT = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const body = (await req.json()) as { categories?: unknown };
    const categories = parseNomineeCategories(body.categories);
    if (!categories || categories.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one category with a title is required." },
        { status: 400 },
      );
    }

    const saved = await saveNomineeCategories(categories);
    return NextResponse.json({ success: true, categories: saved });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominee Categories",
      route: req.nextUrl.pathname,
      provider: "Nominee Storage",
    });
  }
}, { workflow: "HQ Nominee Categories" });
