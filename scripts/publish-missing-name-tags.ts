/**
 * Publish nominees without graphics as name-tags only — only in categories
 * that already have at least one graphic nominee live on the site.
 *
 *   npx tsx scripts/publish-missing-name-tags.ts --apply
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const APPLY = process.argv.includes("--apply");

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
    // optional
  }
}

loadEnvFile();

function hasGraphic(entry: { nomineeGraphicUrl: string; nomineeGraphicMediaId: string }): boolean {
  return Boolean(entry.nomineeGraphicUrl?.trim() || entry.nomineeGraphicMediaId?.trim());
}

async function main() {
  const { listNomineeCategories } = await import("../src/lib/nominee-categories-store");
  const { listNominees } = await import("../src/lib/nominees-store");
  const {
    listNomineePageEntries,
    listPublishedNomineePageCategories,
    saveNomineePageEntry,
  } = await import("../src/lib/nominee-workflows-store");

  const [categories, nominees, entries] = await Promise.all([
    listNomineeCategories(),
    listNominees(),
    listNomineePageEntries(),
  ]);

  const entryByNominee = new Map(entries.map((e) => [e.nomineeId, e]));
  const activeIds = new Set(categories.filter((c) => c.active).map((c) => c.id));

  const liveCategories = (await listPublishedNomineePageCategories()).map((c) => c.id);
  const liveCategorySet = new Set(liveCategories);

  let published = 0;

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`Live categories with graphics: ${liveCategories.length}\n`);

  for (const categoryId of liveCategorySet) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) continue;

    const catNominees = nominees.filter(
      (n) => n.categoryId === categoryId && activeIds.has(n.categoryId),
    );

    for (const nominee of catNominees) {
      const entry = entryByNominee.get(nominee.id);
      if (hasGraphic(entry ?? { nomineeGraphicUrl: "", nomineeGraphicMediaId: "" })) continue;
      if (entry?.publishToNomineePage && entry.status === "Published") continue;

      console.log(`  ${nominee.name} → ${category.title} (name tag)`);
      if (!APPLY) continue;

      await saveNomineePageEntry(
        {
          nomineeId: nominee.id,
          categoryId: nominee.categoryId,
          nomineeGraphicMediaId: entry?.nomineeGraphicMediaId ?? "",
          nomineeGraphicUrl: entry?.nomineeGraphicUrl ?? "",
          displayOrder: entry?.displayOrder ?? entries.length + published + 1,
          publishToNomineePage: true,
          status: "Published",
          createdByName: entry?.createdByName || "Name Tag Publish",
          createdByEmail: entry?.createdByEmail || "hq@setvawards.com",
        },
        entry?.id ?? `page_${nominee.id}`,
      );
      published += 1;
    }
  }

  console.log(`\n${APPLY ? `Published ${published} name-tag nominee(s).` : "Dry run — re-run with --apply."}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
