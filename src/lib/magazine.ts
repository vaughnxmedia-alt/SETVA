import { listPublishedNomineeMagazineArticles } from "@/lib/nominee-workflows-store";
import { listPublishedHonorees } from "@/lib/honorees-store";
import { featuredMagazineArticles } from "@/lib/magazine-featured";
import { htmlToPlainText, plainTextToMagazineHtml } from "@/lib/magazine-html";
import { sanitizeMagazineHtml } from "@/lib/sanitize-html";
import type { Honoree, PublicHonoree } from "@/lib/honorees";

export type MagazineArticle = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  publishedLabel: string;
  nomineeBioHtml: string;
  pullQuote: string;
  articleBodyHtml: string;
};

export const visionaryMagazine = {
  name: "Visionary Magazine",
  tagline: "Stories, announcements, and vision from across the 409.",
} as const;

/**
 * Public Visionary Magazine visibility toggle. While false, the public /magazine
 * routes return 404 and the nav links are hidden, but the pages, Headquarters
 * tooling, and all backend data remain intact. Set to true to relaunch.
 */
export const MAGAZINE_PUBLIC_ENABLED = false;

export const magazineArticles: MagazineArticle[] = featuredMagazineArticles;

function mapStoredArticle(article: Awaited<ReturnType<typeof listPublishedNomineeMagazineArticles>>[number]): MagazineArticle {
  const nomineeBioHtml = sanitizeMagazineHtml(
    plainTextToMagazineHtml(article.nomineeBio),
  );
  const articleBodyHtml = sanitizeMagazineHtml(
    plainTextToMagazineHtml(article.articleBody),
  );
  const excerptSource =
    htmlToPlainText(articleBodyHtml) ||
    htmlToPlainText(nomineeBioHtml) ||
    article.pullQuote ||
    "SETVA nominee feature.";

  return {
    slug: article.slug,
    title: article.articleTitle,
    excerpt: excerptSource.slice(0, 220),
    publishedAt: article.publishDate || article.updatedAt,
    publishedLabel: formatMagazineDate(article.publishDate || article.updatedAt),
    nomineeBioHtml,
    pullQuote: article.pullQuote.trim(),
    articleBodyHtml,
  };
}

export async function listMagazineArticles(): Promise<MagazineArticle[]> {
  const stored = await listPublishedNomineeMagazineArticles();
  const storedArticles = stored.map(mapStoredArticle);
  const storedSlugs = new Set(storedArticles.map((article) => article.slug));

  const merged = [
    ...storedArticles,
    ...featuredMagazineArticles.filter((article) => !storedSlugs.has(article.slug)),
  ];

  return merged.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function getMagazineArticle(slug: string): Promise<MagazineArticle | undefined> {
  const stored = await listPublishedNomineeMagazineArticles();
  const match = stored.find((article) => article.slug === slug);
  if (match) return mapStoredArticle(match);
  return featuredMagazineArticles.find((article) => article.slug === slug);
}

function mapHonoree(honoree: Honoree): PublicHonoree {
  const accomplishmentsHtml = sanitizeMagazineHtml(
    plainTextToMagazineHtml(honoree.accomplishments),
  );
  return {
    slug: honoree.slug,
    name: honoree.name,
    awardTitle: honoree.awardTitle,
    graphicUrl: honoree.graphicUrl,
    accomplishmentsHtml,
    pullQuote: honoree.pullQuote.trim(),
    publishedLabel: formatMagazineDate(honoree.updatedAt),
  };
}

export async function listMagazineHonorees(): Promise<PublicHonoree[]> {
  const honorees = await listPublishedHonorees();
  return honorees.map(mapHonoree);
}

export async function getMagazineHonoree(slug: string): Promise<PublicHonoree | undefined> {
  const honorees = await listPublishedHonorees();
  const match = honorees.find((honoree) => honoree.slug === slug);
  return match ? mapHonoree(match) : undefined;
}

function formatMagazineDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
