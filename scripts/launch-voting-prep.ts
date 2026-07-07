/**
 * Launch prep: publish all nominees, fix category alignment, enable videos, backfill links.
 *
 *   npx tsx scripts/launch-voting-prep.ts
 *   npx tsx scripts/launch-voting-prep.ts --apply
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

async function main() {
  const { listNomineeCategories, saveNomineeCategories } = await import(
    "../src/lib/nominee-categories-store"
  );
  const { listNomineesWithTicketPartnerSlugs } = await import("../src/lib/nominees-store");
  const {
    listNomineePageEntries,
    listPublishedNomineePageCategories,
    saveNomineePageEntry,
  } = await import("../src/lib/nominee-workflows-store");
  const { categoryExpectsVideo } = await import("../src/lib/nominee-category-groups");

  const [categories, nominees, entries, beforePublic] = await Promise.all([
    listNomineeCategories(),
    listNomineesWithTicketPartnerSlugs(),
    listNomineePageEntries(),
    listPublishedNomineePageCategories(),
  ]);

  const activeCategoryIds = new Set(
    categories.filter((category) => category.active).map((category) => category.id),
  );
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const entryByNominee = new Map(entries.map((entry) => [entry.nomineeId, entry]));

  const issues: string[] = [];
  let entriesFixed = 0;
  let entriesCreated = 0;
  let entriesPublished = 0;
  let videosEnabled = 0;

  const eligibleNominees = nominees.filter((nominee) => activeCategoryIds.has(nominee.categoryId));

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);
  console.log(`Active categories: ${activeCategoryIds.size}`);
  console.log(`Nominees in active categories: ${eligibleNominees.length}`);
  console.log(`Currently on /nominations: ${beforePublic.length} categories, ${beforePublic.reduce((sum, category) => sum + category.nominees.length, 0)} nominees\n`);

  for (const nominee of eligibleNominees) {
    const category = categoryById.get(nominee.categoryId);
    if (!category) {
      issues.push(`ORPHAN: ${nominee.name} → unknown category ${nominee.categoryId}`);
      continue;
    }

    const existing = entryByNominee.get(nominee.id);
    if (existing && existing.categoryId !== nominee.categoryId) {
      issues.push(
        `MISMATCH: ${nominee.name} page entry in "${categoryById.get(existing.categoryId)?.title ?? existing.categoryId}" but nominee is in "${category.title}"`,
      );
      if (APPLY) {
        await saveNomineePageEntry(
          {
            nomineeId: nominee.id,
            categoryId: nominee.categoryId,
            nomineeGraphicMediaId: existing.nomineeGraphicMediaId,
            nomineeGraphicUrl: existing.nomineeGraphicUrl,
            displayOrder: existing.displayOrder,
            publishToNomineePage: true,
            status: "Published",
            createdByName: existing.createdByName || "Launch Prep",
            createdByEmail: existing.createdByEmail || "hq@setvawards.com",
          },
          existing.id,
        );
        entriesFixed += 1;
      }
      continue;
    }

    const needsPublish =
      !existing ||
      !existing.publishToNomineePage ||
      existing.status !== "Published";

    if (!needsPublish) continue;

    if (!existing) {
      issues.push(`CREATE: ${nominee.name} → ${category.title}`);
      if (APPLY) {
        await saveNomineePageEntry(
          {
            nomineeId: nominee.id,
            categoryId: nominee.categoryId,
            nomineeGraphicMediaId: "",
            nomineeGraphicUrl: "",
            displayOrder: entries.length + entriesCreated + 1,
            publishToNomineePage: true,
            status: "Published",
            createdByName: "Launch Prep",
            createdByEmail: "hq@setvawards.com",
          },
          `page_${nominee.id}`,
        );
        entriesCreated += 1;
      }
      continue;
    }

    if (APPLY) {
      await saveNomineePageEntry(
        {
          nomineeId: nominee.id,
          categoryId: nominee.categoryId,
          nomineeGraphicMediaId: existing.nomineeGraphicMediaId,
          nomineeGraphicUrl: existing.nomineeGraphicUrl,
          displayOrder: existing.displayOrder,
          publishToNomineePage: true,
          status: "Published",
          createdByName: existing.createdByName || "Launch Prep",
          createdByEmail: existing.createdByEmail || "hq@setvawards.com",
        },
        existing.id,
      );
      entriesPublished += 1;
    }
  }

  const updatedCategories = categories.map((category) => {
    if (!category.active) return category;
    const hasNominees = eligibleNominees.some((nominee) => nominee.categoryId === category.id);
    if (!hasNominees) return category;

    const hasVideo = Boolean(category.videoUrl?.trim());
    const shouldPublishVideo = hasVideo && categoryExpectsVideo(category);
    if (!shouldPublishVideo || category.publishVideo) return category;

    issues.push(`VIDEO: enable category video for ${category.title}`);
    videosEnabled += 1;
    return {
      ...category,
      publishVideo: true,
      status: category.status === "Published" ? "Published" : "Published",
    };
  });

  if (APPLY && videosEnabled > 0) {
    await saveNomineeCategories(updatedCategories);
  }

  const afterPublic = APPLY ? await listPublishedNomineePageCategories() : beforePublic;
  const categoriesWithNominees = categories.filter(
    (category) =>
      category.active && eligibleNominees.some((nominee) => nominee.categoryId === category.id),
  );
  const missingCategories = categoriesWithNominees.filter(
    (category) => !afterPublic.some((publicCategory) => publicCategory.id === category.id),
  );

  console.log("--- Summary ---");
  console.log(`Category mismatches to fix: ${issues.filter((issue) => issue.startsWith("MISMATCH")).length}`);
  console.log(`Entries to create: ${issues.filter((issue) => issue.startsWith("CREATE")).length}`);
  console.log(`Videos to enable: ${videosEnabled}`);
  console.log(`Orphans: ${issues.filter((issue) => issue.startsWith("ORPHAN")).length}`);

  if (issues.length) {
    console.log("\n--- Details ---");
    for (const issue of issues.slice(0, 40)) console.log(`  ${issue}`);
    if (issues.length > 40) console.log(`  ... and ${issues.length - 40} more`);
  }

  if (APPLY) {
    console.log(`\nApplied:`);
    console.log(`  Fixed category mismatches: ${entriesFixed}`);
    console.log(`  Created page entries: ${entriesCreated}`);
    console.log(`  Published page entries: ${entriesPublished}`);
    console.log(`  Enabled category videos: ${videosEnabled}`);
    console.log(`  Frontend: ${beforePublic.length} → ${afterPublic.length} categories`);
    console.log(
      `  Frontend nominees: ${beforePublic.reduce((sum, category) => sum + category.nominees.length, 0)} → ${afterPublic.reduce((sum, category) => sum + category.nominees.length, 0)}`,
    );
  }

  if (missingCategories.length && APPLY) {
    console.log("\nCategories still missing from frontend:");
    for (const category of missingCategories) console.log(`  - ${category.title}`);
  }

  if (!APPLY) {
    console.log("\nRe-run with --apply to publish for launch.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
