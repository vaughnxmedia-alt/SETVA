import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { writeCategoryVideoFile } from "@/lib/nomination-assets";

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const categoryId = String(formData.get("categoryId") ?? "").trim();
    const existingUrl = String(formData.get("existingUrl") ?? "").trim();

    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ success: false, error: "Video file is required." }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Category is required." }, { status: 400 });
    }

    const url = await writeCategoryVideoFile({
      categoryId,
      buffer: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      existingUrl,
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Category Media",
      route: req.nextUrl.pathname,
      provider: "Nomination Asset Storage",
    });
  }
}, { workflow: "HQ Category Media" });
