import { readFileSync } from "fs";
import { resolve } from "path";
import { featuredMagazineArticles } from "../src/lib/magazine-featured";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env.local");
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

async function main() {
  const { saveNomineeMagazineArticle } = await import("../src/lib/nominee-workflows-store");

  for (const article of featuredMagazineArticles) {
    await saveNomineeMagazineArticle(
      {
        nomineeId: "",
        articleTitle: article.title,
        nomineeBio: article.nomineeBioHtml,
        articleBody: article.articleBodyHtml,
        pullQuote: article.pullQuote,
        articleImageMediaId: "",
        articleImageUrl: "",
        publishToMagazine: true,
        articleStatus: "Published",
        publishDate: article.publishedAt,
        slug: article.slug,
        createdByName: "SETVA Seed Script",
        createdByEmail: "seed@setvawards.com",
      },
      `mag_seed_${article.slug}`,
    );
  }

  console.log(`Seeded ${featuredMagazineArticles.length} featured magazine article(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
