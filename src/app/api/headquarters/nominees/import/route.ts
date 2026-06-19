import { NextRequest, NextResponse } from "next/server";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { categoryTitleById, listNomineeCategories } from "@/lib/nominee-categories-store";
import { parseNomineeCsv } from "@/lib/nominees-csv";
import { saveNomineesBulk } from "@/lib/nominees-store";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const body = (await req.json()) as { csv?: string };
    const csv = String(body.csv ?? "").trim();
    if (!csv) {
      return NextResponse.json({ success: false, error: "CSV content is required." }, { status: 400 });
    }

    const categories = await listNomineeCategories();
    const parsed = parseNomineeCsv(csv, categories);
    if (parsed.errors.length && parsed.rows.length === 0) {
      return NextResponse.json({ success: false, errors: parsed.errors }, { status: 400 });
    }

    const result = await saveNomineesBulk(parsed.rows, { name: user.name, email: user.email });
    const withTitles = result.saved.map((nominee) => ({
      ...nominee,
      categoryTitle: categoryTitleById(categories, nominee.categoryId),
    }));

    return NextResponse.json({
      success: true,
      imported: withTitles.length,
      nominees: withTitles,
      errors: [...parsed.errors, ...result.failed.map((f) => `${f.row.name}: ${f.error}`)],
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominees Import",
      route: req.nextUrl.pathname,
      provider: "Nominee Storage",
    });
  }
}, { workflow: "HQ Nominees Import" });
