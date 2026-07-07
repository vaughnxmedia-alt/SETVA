import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { categoryById, listNomineeCategories } from "@/lib/nominee-categories-store";
import { categoryAllowsNomineeGraphic } from "@/lib/nominee-category-groups";
import { writeNomineeGraphicFile } from "@/lib/nomination-assets";

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const nomineeId = String(formData.get("nomineeId") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? "").trim();
    const existingUrl = String(formData.get("existingUrl") ?? "").trim();

    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ success: false, error: "Image file is required." }, { status: 400 });
    }
    if (!nomineeId || !categoryId) {
      return NextResponse.json(
        { success: false, error: "Nominee and category are required." },
        { status: 400 },
      );
    }

    const categories = await listNomineeCategories();
    const category = categoryById(categories, categoryId);
    if (!categoryAllowsNomineeGraphic(category)) {
      return NextResponse.json(
        {
          success: false,
          error: "Nominee graphics are only used for Special award categories. Other categories use torch name cards.",
        },
        { status: 400 },
      );
    }

    const url = await writeNomineeGraphicFile({
      categoryId,
      nomineeId,
      buffer: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      existingUrl,
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominee Graphics",
      route: req.nextUrl.pathname,
      provider: "Nomination Asset Storage",
    });
  }
}, { workflow: "HQ Nominee Graphics" });
