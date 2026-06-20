import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { writeNomineeGraphicFile } from "@/lib/nomination-assets";

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

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
