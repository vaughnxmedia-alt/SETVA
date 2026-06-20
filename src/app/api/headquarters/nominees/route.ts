import { NextRequest, NextResponse } from "next/server";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { categoryTitleById, listNomineeCategories } from "@/lib/nominee-categories-store";
import { parseNomineeInput } from "@/lib/nominees";
import { listNominees, saveNominee } from "@/lib/nominees-store";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const [nominees, categories] = await Promise.all([listNominees(), listNomineeCategories()]);
    return NextResponse.json({
      success: true,
      nominees: nominees.map((nominee) => ({
        ...nominee,
        categoryTitle: categoryTitleById(categories, nominee.categoryId),
      })),
      categories,
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominees",
      route: req.nextUrl.pathname,
      provider: "Nominee Storage",
    });
  }
}, { workflow: "HQ Nominees" });

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const data = parseNomineeInput(body);
    if (!data) {
      return NextResponse.json({ success: false, error: "Name and category are required." }, { status: 400 });
    }

    const categories = await listNomineeCategories();
    if (!categories.some((c) => c.id === data.categoryId && c.active)) {
      return NextResponse.json({ success: false, error: "Invalid category." }, { status: 400 });
    }

    const nominee = await saveNominee(data, { name: user.name, email: user.email });
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
