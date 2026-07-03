import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { parseHonoreeInput } from "@/lib/honorees";
import { deleteHonoree, listHonorees, saveHonoree } from "@/lib/honorees-store";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const honorees = await listHonorees();
    return NextResponse.json({ success: true, honorees });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Honorees",
      route: req.nextUrl.pathname,
      provider: "Honoree Storage",
    });
  }
}, { workflow: "HQ Honorees" });

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = String(body.id ?? "").trim() || undefined;
    const input = parseHonoreeInput(body, user);
    if (!input) {
      return NextResponse.json(
        { success: false, error: "Honoree name and award title are required." },
        { status: 400 },
      );
    }

    const { sanitizeMagazineHtml } = await import("@/lib/sanitize-html");
    const record = await saveHonoree(
      {
        ...input,
        accomplishments: sanitizeMagazineHtml(input.accomplishments),
      },
      id,
    );

    return NextResponse.json({ success: true, record });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Honorees",
      route: req.nextUrl.pathname,
      provider: "Honoree Storage",
    });
  }
}, { workflow: "HQ Honorees" });

export const DELETE = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const id = req.nextUrl.searchParams.get("id") ?? "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Honoree id is required." },
        { status: 400 },
      );
    }

    const deleted = await deleteHonoree(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Honorees",
      route: req.nextUrl.pathname,
      provider: "Honoree Storage",
    });
  }
}, { workflow: "HQ Honorees" });
