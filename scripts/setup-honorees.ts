import { resolve } from "path";
import { readFileSync } from "fs";

function loadEnv() {
  const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const GRAPHICS_DIR = "/Users/juss/Downloads/Nominees";
const APPLY = process.argv.includes("--apply");

// The 10 Special-award categories whose page entries should be pulled off the
// public nominations page (these are honorees, not nominees).
const HONOREE_CATEGORY_IDS = new Set([
  "category-1782684614946", // Creative Project of the Year
  "category-1782685465465", // Pillars of Southeast Texas
  "category-1782685453967", // Musical Architect of the Year
  "category-1782685485844", // Visionary Heart of Service
  "category-1782685636735", // Visionary Stewardship
  "category-1782684367999", // Community Leader of the Year
  "category-1782685436040", // Lifetime Achievement Award
  "category-1782685501832", // Visionary of the Year
  "category-1782685661520", // Youth Impact Award
  "category-1782685406045", // Legacy Award
]);

// Nominee records that were mistakenly created for honorees during the graphic connect step.
const MISTAKEN_NOMINEE_IDS = [
  "nom_connect_zena-stephens_465465",
  "nom_connect_dr-freddie-titus_465465",
  "nom_connect_raymond-stacy-louis_367999",
];

type Seed = { name: string; awardTitle: string; file: string };

const HONOREES: Seed[] = [
  { name: "Quin Gregory", awardTitle: "Visionary of the Year", file: "IMG_8002.PNG" },
  { name: "Benjamin Ben Collins Sr", awardTitle: "Lifetime Achievement Award", file: "IMG_8001.PNG" },
  { name: "Barbara Lynn", awardTitle: "Legacy Award", file: "IMG_8004.PNG" },
  { name: "Kenneth Turner", awardTitle: "Visionary Architect Award", file: "IMG_7976.PNG" },
  { name: "Raymond & Stacy Louis", awardTitle: "Community Leader of the Year", file: "IMG_7999.PNG" },
  { name: "One Nation of Southeast Texas", awardTitle: "Youth Impact of the Year", file: "IMG_8003.PNG" },
  { name: "Patrina Gallow", awardTitle: "Visionary Heart of Service", file: "IMG_7980.PNG" },
  { name: "Pastor John Adolph", awardTitle: "Visionary Stewardship", file: "IMG_7981.PNG" },
  { name: "Zena Stephens", awardTitle: "Visionary Pillar", file: "IMG_7975.PNG" },
  { name: "Joe Tant", awardTitle: "Visionary Pillar", file: "IMG_7978.PNG" },
  { name: "Bradford Coleman", awardTitle: "Visionary Pillar", file: "IMG_7977.PNG" },
  { name: "Dr Freddie Titus", awardTitle: "Visionary Pillar", file: "IMG_7979.PNG" },
  { name: "Whip The Rapper", awardTitle: "Creative Project of the Year", file: "IMG_7974.PNG" },
];

async function main() {
  const { slugifyHonoree } = await import("../src/lib/honorees");
  const { saveHonoree, getHonoree } = await import("../src/lib/honorees-store");
  const { writeHonoreeGraphicFile } = await import("../src/lib/nomination-assets");
  const { listNomineePageEntries, deleteNomineePageEntry } = await import(
    "../src/lib/nominee-workflows-store"
  );
  const { deleteNominee } = await import("../src/lib/nominees-store");

  // 1. Remove honoree page entries from the nominations page.
  const entries = await listNomineePageEntries();
  const toRemove = entries.filter((e) => HONOREE_CATEGORY_IDS.has(e.categoryId));
  console.log(`Page entries to remove from nominations: ${toRemove.length}`);
  for (const e of toRemove) {
    console.log(`  - ${e.id} (cat ${e.categoryId})`);
    if (APPLY) await deleteNomineePageEntry(e.id);
  }

  // 2. Delete mistaken honoree "nominee" records.
  for (const id of MISTAKEN_NOMINEE_IDS) {
    console.log(`Delete mistaken nominee record: ${id}`);
    if (APPLY) await deleteNominee(id);
  }

  // 3 + 4. Upload graphics + create Draft honoree records.
  let order = 1;
  let created = 0;
  const failures: string[] = [];
  for (const seed of HONOREES) {
    const slug = slugifyHonoree(`${seed.name}-${seed.awardTitle}`);
    const honoreeId = `honoree_${slug}`;
    try {
      let graphicUrl = "(dry-run)";
      if (APPLY) {
        graphicUrl = await writeHonoreeGraphicFile({
          slug,
          buffer: readFileSync(resolve(GRAPHICS_DIR, seed.file)),
          fileName: seed.file,
        });
      }

      // Preserve any write-up already entered in HQ; only (re)seed metadata.
      const existing = APPLY ? await getHonoree(honoreeId) : null;

      if (APPLY) {
        await saveHonoree(
          {
            name: seed.name,
            awardTitle: seed.awardTitle,
            graphicUrl,
            accomplishments: existing?.accomplishments ?? "",
            pullQuote: existing?.pullQuote ?? "",
            slug,
            displayOrder: order,
            publishToMagazine: false,
            status: existing?.status ?? "Draft",
            createdByName: "SETVA Setup",
            createdByEmail: "seed@setvawards.com",
          },
          honoreeId,
        );
      }
      created += 1;
      console.log(`  ✓ ${seed.name}  [${seed.awardTitle}]  order ${order}  ${graphicUrl}`);
    } catch (error) {
      failures.push(`${seed.name}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
      console.error(`  ✗ ${seed.name}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
    order += 1;
  }

  console.log(
    `\n${APPLY ? "APPLIED" : "DRY RUN"} — removed ${toRemove.length} page entries, honorees ${created}, failures ${failures.length}`,
  );
  for (const f of failures) console.log("  - " + f);
  if (!APPLY) console.log("\nRe-run with --apply to write to the database.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
