import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { parseNomineeMagazineArticleInput } from "@/lib/nominees";
import { listHonorees } from "@/lib/honorees-store";
import {
  deleteNomineeMagazineArticle,
  listNomineeMagazineArticles,
  saveNomineeMagazineArticle,
} from "@/lib/nominee-workflows-store";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const [articles, honorees] = await Promise.all([
      listNomineeMagazineArticles(),
      listHonorees(),
    ]);

    return NextResponse.json({
      success: true,
      articles: articles.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
      honorees: honorees.map((honoree) => ({
        id: honoree.id,
        name: honoree.name,
        awardTitle: honoree.awardTitle,
      })),
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Visionary Magazine",
      route: req.nextUrl.pathname,
      provider: "Magazine Storage",
    });
  }
}, { workflow: "HQ Visionary Magazine" });

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = String(body.id ?? "").trim() || undefined;
    const input = parseNomineeMagazineArticleInput(body, user);
    if (!input) {
      return NextResponse.json(
        { success: false, error: "Article title is required." },
        { status: 400 },
      );
    }

    const { sanitizeMagazineHtml } = await import("@/lib/sanitize-html");
    const record = await saveNomineeMagazineArticle(
      {
        ...input,
        nomineeBio: sanitizeMagazineHtml(input.nomineeBio),
        articleBody: sanitizeMagazineHtml(input.articleBody),
      },
      id,
    );

    return NextResponse.json({ success: true, record });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Visionary Magazine",
      route: req.nextUrl.pathname,
      provider: "Magazine Storage",
    });
  }
}, { workflow: "HQ Visionary Magazine" });

export const DELETE = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const id = req.nextUrl.searchParams.get("id") ?? "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Article id is required." },
        { status: 400 },
      );
    }

    const deleted = await deleteNomineeMagazineArticle(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Visionary Magazine",
      route: req.nextUrl.pathname,
      provider: "Magazine Storage",
    });
  }
}, { workflow: "HQ Visionary Magazine" });
