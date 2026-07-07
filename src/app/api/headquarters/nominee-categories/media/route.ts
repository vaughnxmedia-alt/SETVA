import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { writeCategoryPosterFile, writeCategoryVideoFile } from "@/lib/nomination-assets";
import { normalizeCategoryVideoBuffer } from "@/lib/normalize-category-video.server";

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const poster = formData.get("poster");
    const categoryId = String(formData.get("categoryId") ?? "").trim();
    const existingUrl = String(formData.get("existingUrl") ?? "").trim();

    const hasVideo = file instanceof File && file.size > 0;
    const hasPoster = poster instanceof File && poster.size > 0;

    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Category is required." }, { status: 400 });
    }
    if (!hasVideo && !hasPoster) {
      return NextResponse.json(
        { success: false, error: "A video or thumbnail file is required." },
        { status: 400 },
      );
    }

    const result: { url?: string; posterUrl?: string } = {};

    if (hasVideo) {
      const rawBuffer = Buffer.from(await file.arrayBuffer());
      const buffer = normalizeCategoryVideoBuffer(rawBuffer);
      result.url = await writeCategoryVideoFile({
        categoryId,
        buffer,
        fileName: file.name,
        existingUrl,
      });
    }

    if (hasPoster) {
      result.posterUrl = await writeCategoryPosterFile({
        categoryId,
        buffer: Buffer.from(await poster.arrayBuffer()),
        fileName: poster.name,
      });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Category Media",
      route: req.nextUrl.pathname,
      provider: "Nomination Asset Storage",
    });
  }
}, { workflow: "HQ Category Media" });
