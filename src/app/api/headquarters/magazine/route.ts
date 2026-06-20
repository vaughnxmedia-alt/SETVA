import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { parseNomineeMagazineArticleInput } from "@/lib/nominees";
import { listNominees } from "@/lib/nominees-store";
import {
  deleteNomineeMagazineArticle,
  listNomineeMagazineArticles,
  saveNomineeMagazineArticle,
} from "@/lib/nominee-workflows-store";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const [articles, nominees] = await Promise.all([
      listNomineeMagazineArticles(),
      listNominees(),
    ]);

    return NextResponse.json({
      success: true,
      articles: articles.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
      nominees: nominees.map((nominee) => ({
        id: nominee.id,
        name: nominee.name,
        categoryId: nominee.categoryId,
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
  const user = getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

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
  const user = getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

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
