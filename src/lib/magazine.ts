import { listPublishedNomineeMagazineArticles } from "@/lib/nominee-workflows-store";

export type MagazineBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string };

export type MagazineArticle = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  publishedLabel: string;
  blocks: MagazineBlock[];
};

export const visionaryMagazine = {
  name: "Visionary Magazine",
  tagline: "Stories, announcements, and vision from across the 409.",
} as const;

export const magazineArticles: MagazineArticle[] = [];

export async function listMagazineArticles(): Promise<MagazineArticle[]> {
  const articles = await listPublishedNomineeMagazineArticles();
  return articles.map((article) => ({
    slug: article.slug,
    title: article.articleTitle,
    excerpt: article.nomineeBio || article.pullQuote || "SETVA nominee feature.",
    publishedAt: article.publishDate || article.updatedAt,
    publishedLabel: formatMagazineDate(article.publishDate || article.updatedAt),
    blocks: articleToBlocks(article.nomineeBio, article.pullQuote, article.articleBody),
  }));
}

export async function getMagazineArticle(slug: string): Promise<MagazineArticle | undefined> {
  const articles = await listMagazineArticles();
  return articles.find((article) => article.slug === slug);
}

function articleToBlocks(
  nomineeBio: string,
  pullQuote: string,
  articleBody: string,
): MagazineBlock[] {
  const blocks: MagazineBlock[] = [];
  if (nomineeBio) blocks.push({ type: "paragraph", text: nomineeBio });
  if (pullQuote) blocks.push({ type: "heading", text: pullQuote });
  for (const paragraph of articleBody.split(/\n{2,}/).map((line) => line.trim()).filter(Boolean)) {
    blocks.push({ type: "paragraph", text: paragraph });
  }
  return blocks;
}

function formatMagazineDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
