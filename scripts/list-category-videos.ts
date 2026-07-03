import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Lists every nominee category stored in Supabase and whether it has a video,
 * a thumbnail, and published nominees. Run against the live database to see
 * exactly which categories still need a video uploaded.
 *
 *   npx tsx scripts/list-category-videos.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (the same
 * production credentials Headquarters uses).
 */

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
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
  } catch {
    // .env.local optional for local-only runs
  }
}

loadEnvFile();

async function main() {
  const { isSupabaseConfigured } = await import("../src/lib/supabase/server");
  if (!isSupabaseConfigured()) {
    console.error(
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local, then re-run.",
    );
    process.exit(1);
  }

  const { listNomineeCategories } = await import("../src/lib/nominee-categories-store");
  const { listNomineePageEntries } = await import("../src/lib/nominee-workflows-store");

  const [categories, pageEntries] = await Promise.all([
    listNomineeCategories(),
    listNomineePageEntries(),
  ]);

  const publishedByCategory = new Map<string, number>();
  for (const entry of pageEntries) {
    if (entry.publishToNomineePage && entry.status === "Published") {
      publishedByCategory.set(
        entry.categoryId,
        (publishedByCategory.get(entry.categoryId) ?? 0) + 1,
      );
    }
  }

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const missingVideo: string[] = [];
  const missingThumbnail: string[] = [];
  const notLive: string[] = [];

  console.log(`\nTotal categories in Supabase: ${sorted.length}\n`);
  console.log(
    ["#", "Category", "Video", "Thumb", "PublishVideo", "Status", "PublishedNominees"].join(" | "),
  );
  console.log("-".repeat(96));

  sorted.forEach((category, index) => {
    const hasVideo = Boolean(category.videoUrl?.trim());
    const hasThumb = Boolean(category.videoPosterUrl?.trim());
    const publishedCount = publishedByCategory.get(category.id) ?? 0;
    const isLive = category.status === "Published" && publishedCount > 0;

    if (!hasVideo) missingVideo.push(category.title);
    if (hasVideo && !hasThumb) missingThumbnail.push(category.title);
    if (!isLive) notLive.push(category.title);

    console.log(
      [
        String(index + 1).padStart(2, " "),
        category.title,
        hasVideo ? "YES" : "NO ",
        hasThumb ? "YES" : "NO ",
        category.publishVideo ? "yes" : "no ",
        category.status,
        String(publishedCount),
      ].join(" | "),
    );
  });

  console.log("\n=== Summary ===");
  console.log(`Categories WITHOUT a video (${missingVideo.length}):`);
  missingVideo.forEach((title) => console.log(`  - ${title}`));

  console.log(`\nCategories with a video but NO thumbnail (${missingThumbnail.length}):`);
  missingThumbnail.forEach((title) => console.log(`  - ${title}`));

  console.log(`\nCategories NOT yet live on the site (${notLive.length}):`);
  notLive.forEach((title) => console.log(`  - ${title}`));
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
