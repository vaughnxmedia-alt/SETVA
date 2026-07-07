/**
 * Publish every nominee page entry that has a graphic but isn't live yet.
 *
 * Usage:
 *   npx tsx scripts/publish-nominees-with-graphics.ts          # dry run
 *   npx tsx scripts/publish-nominees-with-graphics.ts --apply    # write to Supabase
 */
import { readFileSync } from "fs";
import { resolve } from "path";

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

const APPLY = process.argv.includes("--apply");

function hasGraphic(entry: {
  nomineeGraphicUrl: string;
  nomineeGraphicMediaId: string;
}): boolean {
  return Boolean(entry.nomineeGraphicUrl?.trim() || entry.nomineeGraphicMediaId?.trim());
}

function isPublished(entry: {
  publishToNomineePage: boolean;
  status: string;
}): boolean {
  return Boolean(entry.publishToNomineePage && entry.status === "Published");
}

async function main() {
  const { listNomineeCategories } = await import("../src/lib/nominee-categories-store");
  const { listNominees } = await import("../src/lib/nominees-store");
  const {
    listNomineePageEntries,
    listPublishedNomineePageCategories,
    saveNomineePageEntry,
  } = await import("../src/lib/nominee-workflows-store");

  const [categories, nominees, entries, beforePublic] = await Promise.all([
    listNomineeCategories(),
    listNominees(),
    listNomineePageEntries(),
    listPublishedNomineePageCategories(),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const nomineeById = new Map(nominees.map((n) => [n.id, n]));
  const entryByNominee = new Map(entries.map((e) => [e.nomineeId, e]));

  const toPublish: Array<{
    nomineeName: string;
    categoryTitle: string;
    entryId: string;
    nomineeId: string;
    categoryId: string;
    graphicUrl: string;
    nomineeGraphicMediaId: string;
    displayOrder: number;
    createdByName: string;
    createdByEmail: string;
  }> = [];

  const alreadyLive: string[] = [];
  const noGraphic: string[] = [];

  for (const nominee of nominees) {
    const entry = entryByNominee.get(nominee.id);
    if (!entry || !hasGraphic(entry)) {
      noGraphic.push(`${nominee.name} (${categoryById.get(nominee.categoryId)?.title ?? nominee.categoryId})`);
      continue;
    }
    if (isPublished(entry)) {
      alreadyLive.push(nominee.name);
      continue;
    }

    toPublish.push({
      nomineeName: nominee.name,
      categoryTitle: categoryById.get(nominee.categoryId)?.title ?? nominee.categoryId,
      entryId: entry.id,
      nomineeId: nominee.id,
      categoryId: nominee.categoryId,
      graphicUrl: entry.nomineeGraphicUrl,
      nomineeGraphicMediaId: entry.nomineeGraphicMediaId,
      displayOrder: entry.displayOrder,
      createdByName: entry.createdByName || "SETVA Publish Script",
      createdByEmail: entry.createdByEmail || "hq@setvawards.com",
    });
  }

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);
  console.log(`Nominees with graphics already published: ${alreadyLive.length}`);
  console.log(`Nominees without graphics: ${noGraphic.length}`);
  console.log(`Nominees to publish: ${toPublish.length}\n`);

  if (toPublish.length === 0) {
    console.log("Nothing to publish.");
    return;
  }

  const byCategory = new Map<string, typeof toPublish>();
  for (const row of toPublish) {
    const list = byCategory.get(row.categoryTitle) ?? [];
    list.push(row);
    byCategory.set(row.categoryTitle, list);
  }

  console.log("--- Will publish ---");
  for (const [title, rows] of [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`\n${title} (${rows.length})`);
    for (const row of rows) console.log(`  - ${row.nomineeName}`);
  }

  if (!APPLY) {
    console.log("\nRe-run with --apply to publish these nominees.");
    return;
  }

  let published = 0;
  for (const row of toPublish) {
    await saveNomineePageEntry(
      {
        nomineeId: row.nomineeId,
        categoryId: row.categoryId,
        nomineeGraphicMediaId: row.nomineeGraphicMediaId,
        nomineeGraphicUrl: row.graphicUrl,
        displayOrder: row.displayOrder,
        publishToNomineePage: true,
        status: "Published",
        createdByName: row.createdByName,
        createdByEmail: row.createdByEmail,
      },
      row.entryId,
    );
    published += 1;
    console.log(`Published: ${row.nomineeName} → ${row.categoryTitle}`);
  }

  const afterPublic = await listPublishedNomineePageCategories();
  const beforeCount = beforePublic.reduce((sum, c) => sum + c.nominees.length, 0);
  const afterCount = afterPublic.reduce((sum, c) => sum + c.nominees.length, 0);

  console.log(`\nDone. Published ${published} nominee(s).`);
  console.log(`Frontend nominees: ${beforeCount} → ${afterCount}`);
  console.log(`Frontend categories: ${beforePublic.length} → ${afterPublic.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
