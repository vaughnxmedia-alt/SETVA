import { listPublishedNomineeMagazineArticles } from "@/lib/nominee-workflows-store";
import {
  htmlToPlainText,
  plainTextToMagazineHtml,
  sanitizeMagazineHtml,
} from "@/lib/sanitize-html";

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

export const magazineArticles: MagazineArticle[] = [];

export async function listMagazineArticles(): Promise<MagazineArticle[]> {
  const articles = await listPublishedNomineeMagazineArticles();
  return articles.map((article) => {
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
  });
}

export async function getMagazineArticle(slug: string): Promise<MagazineArticle | undefined> {
  const articles = await listMagazineArticles();
  return articles.find((article) => article.slug === slug);
}

function formatMagazineDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
