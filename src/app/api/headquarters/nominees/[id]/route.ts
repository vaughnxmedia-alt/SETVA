import { NextRequest, NextResponse } from "next/server";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { categoryTitleById, listNomineeCategories } from "@/lib/nominee-categories-store";
import { parseNomineeAdminUpdate } from "@/lib/nominees";
import { deleteNominee, getNominee, updateNominee } from "@/lib/nominees-store";
import { deleteNomineePageEntry, listNomineePageEntries } from "@/lib/nominee-workflows-store";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";

function nomineeIdFromPath(pathname: string): string {
  return pathname.split("/").pop() ?? "";
}

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  const id = nomineeIdFromPath(req.nextUrl.pathname);

  try {
    const nominee = await getNominee(id);
    if (!nominee) return publicErrorResponse(404);

    const categories = await listNomineeCategories();
    return NextResponse.json({
      success: true,
      nominee: {
        ...nominee,
        categoryTitle: categoryTitleById(categories, nominee.categoryId),
      },
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominees",
      route: req.nextUrl.pathname,
      provider: "Nominee Storage",
    });
  }
}, { workflow: "HQ Nominees" });

export const PATCH = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  const id = nomineeIdFromPath(req.nextUrl.pathname);

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { data, admin } = parseNomineeAdminUpdate(body);

    if (data?.categoryId) {
      const categories = await listNomineeCategories();
      if (!categories.some((c) => c.id === data.categoryId && c.active)) {
        return NextResponse.json({ success: false, error: "Invalid category." }, { status: 400 });
      }
    }

    const nominee = await updateNominee(id, { data, admin });
    if (!nominee) return publicErrorResponse(404);

    if (data?.categoryId) {
      const { syncNomineePageEntryCategory } = await import("@/lib/nominee-consistency-store");
      await syncNomineePageEntryCategory(id, data.categoryId);
    }

    const categories = await listNomineeCategories();
    return NextResponse.json({
      success: true,
      nominee: {
        ...nominee,
        categoryTitle: categoryTitleById(categories, nominee.categoryId),
      },
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominees",
      route: req.nextUrl.pathname,
      provider: "Nominee Storage",
    });
  }
}, { workflow: "HQ Nominees" });

export const DELETE = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  const id = nomineeIdFromPath(req.nextUrl.pathname);

  try {
    const pageEntries = await listNomineePageEntries();
    for (const entry of pageEntries.filter((item) => item.nomineeId === id)) {
      await deleteNomineePageEntry(entry.id);
    }

    const deleted = await deleteNominee(id);
    if (!deleted) return publicErrorResponse(404);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominees",
      route: req.nextUrl.pathname,
      provider: "Nominee Storage",
    });
  }
}, { workflow: "HQ Nominees" });
