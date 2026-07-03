import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { writeHonoreeGraphicFile } from "@/lib/nomination-assets";

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const slug = String(formData.get("slug") ?? "").trim();

    if (!slug) {
      return NextResponse.json({ success: false, error: "Honoree slug is required." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: "An image file is required." }, { status: 400 });
    }

    const url = await writeHonoreeGraphicFile({
      slug,
      buffer: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Honoree Graphic",
      route: req.nextUrl.pathname,
      provider: "Nomination Asset Storage",
    });
  }
}, { workflow: "HQ Honoree Graphic" });
