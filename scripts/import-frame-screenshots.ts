/**
 * Import nominee graphics from phone screenshots of Facebook reels.
 * Handles person portraits and business/logo slides.
 *
 * Usage:
 *   npx tsx scripts/import-frame-screenshots.ts
 *   npx tsx scripts/import-frame-screenshots.ts --apply
 *   npx tsx scripts/import-frame-screenshots.ts --dir="/path/to/folder" --apply
 */
import { readFileSync, readdirSync, mkdirSync, existsSync } from "fs";
import { basename, resolve } from "path";
import {
  categoryHintScore,
  cropPosterFromScreenshot,
  cropToPortrait,
  isBusinessNominee,
  matchThresholdForNominee,
  ocrRegions,
  rawNameMatchScore,
  ocrNormalize,
} from "./nominee-frame-matching";

function nomineeMatchesHint(nomineeName: string, hint: string): boolean {
  const nomineeNorm = ocrNormalize(nomineeName);
  const hintNorm = ocrNormalize(hint);
  if (!nomineeNorm || !hintNorm) return false;
  if (nomineeNorm.includes(hintNorm) || hintNorm.includes(nomineeNorm)) return true;
  const hintTokens = hintNorm.split(" ").filter((t) => t.length > 3);
  if (hintTokens.length === 0) return false;
  return hintTokens.every((t) => nomineeNorm.includes(t));
}

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");
const ONLY_FILE = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);
const DIR_ARG = process.argv.find((a) => a.startsWith("--dir="))?.slice("--dir=".length);
const SOURCE_DIR = DIR_ARG ?? "/Users/juss/Downloads/New Folder With Items";
const OUT_DIR = resolve(process.cwd(), "nominee-frame-extracts", "screenshot-imports");

/** Fallback when category banner OCR is weak — keyed by screenshot filename. */
const FILE_NOMINEE_HINTS: Record<string, string> = {
  "IMG_8066.PNG": "kayla collection",
  "IMG_8067.PNG": "tumeric touch",
  "IMG_8068.PNG": "livol herbal",
  "IMG_8069.PNG": "chakra beauty",
  "IMG_8073.PNG": "work hard stay humble",
  "IMG_8074.PNG": "yasmine anderson",
  "IMG_8075.PNG": "rikayla ambers",
  "IMG_8076.PNG": "trey knighton",
  "IMG_8078.PNG": "tyler crutchfield",
  "IMG_8079.PNG": "shelby williams",
};

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
  if (!existsSync(SOURCE_DIR)) {
    console.error(`Folder not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const { listNominees } = await import("../src/lib/nominees-store");
  const { listNomineeCategories } = await import("../src/lib/nominee-categories-store");
  const { listNomineePageEntries, saveNomineePageEntry } = await import(
    "../src/lib/nominee-workflows-store"
  );
  const { writeNomineeGraphicFile } = await import("../src/lib/nomination-assets");

  const [nominees, categories, entries] = await Promise.all([
    listNominees(),
    listNomineeCategories(),
    listNomineePageEntries(),
  ]);
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const graphicByNominee = new Map(
    entries
      .filter((e) => e.nomineeGraphicUrl?.trim())
      .map((e) => [e.nomineeId, e]),
  );
  const entryIdByNominee = new Map(entries.map((e) => [e.nomineeId, e.id]));

  const files = readdirSync(SOURCE_DIR)
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .filter((f) => !ONLY_FILE || f === ONLY_FILE)
    .sort();

  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Files: ${files.length}\n`);

  let uploaded = 0;

  for (const file of files) {
    const inputPath = resolve(SOURCE_DIR, file);
    const workDir = resolve(OUT_DIR, basename(file, /\.[^.]+$/.exec(file)?.[0] ?? ""));
    mkdirSync(workDir, { recursive: true });

    const posterPath = resolve(workDir, "poster.jpg");
    const graphicPath = resolve(workDir, "graphic.jpg");
    cropPosterFromScreenshot(inputPath, posterPath);

    const regions = ocrRegions(posterPath, workDir, "poster");
    cropToPortrait(posterPath, graphicPath);

    console.log(`=== ${file} ===`);
    console.log(`  logo OCR: ${regions.logo.slice(0, 90)}${regions.logo.length > 90 ? "…" : ""}`);
    console.log(`  banner OCR: ${regions.banner.slice(0, 90)}${regions.banner.length > 90 ? "…" : ""}`);

    let best: {
      nomineeId: string;
      name: string;
      categoryTitle: string;
      score: number;
      business: boolean;
    } | null = null;

    const fileHint = FILE_NOMINEE_HINTS[file];
    const hintNorm = fileHint ? ocrNormalize(fileHint) : "";

    if (fileHint) {
      const hintedNominee = nominees.find((n) => nomineeMatchesHint(n.name, fileHint));
      if (!hintedNominee) {
        console.log(`  hint "${fileHint}" — no matching nominee in HQ, skipping`);
        continue;
      }
      if (graphicByNominee.has(hintedNominee.id) && !FORCE) {
        console.log(`  hint match ${hintedNominee.name} — graphic already exists`);
        continue;
      }
      best = {
        nomineeId: hintedNominee.id,
        name: hintedNominee.name,
        categoryTitle:
          categoryById.get(hintedNominee.categoryId)?.title ?? hintedNominee.categoryId,
        score: 3,
        business: isBusinessNominee(hintedNominee.name),
      };
    } else if (!best) for (const nominee of nominees) {
      const categoryTitle = categoryById.get(nominee.categoryId)?.title ?? "";
      const nameScore = rawNameMatchScore(regions, nominee.name);
      const threshold = matchThresholdForNominee(nominee.name);
      const hint = categoryHintScore(regions, categoryTitle);
      let score = nameScore + hint * 0.6;

      if (hintNorm && ocrNormalize(nominee.name).includes(hintNorm)) {
        score += 2;
      } else if (hintNorm) {
        const nomineeNorm = ocrNormalize(nominee.name);
        const hintTokens = hintNorm.split(" ").filter((t) => t.length > 3);
        const overlap = hintTokens.filter((t) => nomineeNorm.includes(t)).length;
        if (overlap >= Math.max(1, hintTokens.length - 1)) score += 1.5;
      }

      if (!Number.isFinite(nameScore) || nameScore < threshold) {
        if (score < 1.5) continue;
      }
      if (hint < 0.2 && nameScore < 0.8 && score < 1.5) continue;

      if (!best || score > best.score) {
        best = {
          nomineeId: nominee.id,
          name: nominee.name,
          categoryTitle: categoryById.get(nominee.categoryId)?.title ?? nominee.categoryId,
          score,
          business: isBusinessNominee(nominee.name),
        };
      }
    }

    if (!best) {
      console.log("  no nominee match");
      continue;
    }

    const kind = best.business ? "business/logo" : "person";
    console.log(
      `  match: ${best.name} → ${best.categoryTitle} (${kind}, ${(best.score * 100).toFixed(0)}%)`,
    );

    if (graphicByNominee.has(best.nomineeId) && !FORCE) {
      console.log("  skip — graphic already exists");
      continue;
    }

    if (!APPLY) {
      console.log("  dry-run — would upload");
      continue;
    }

    const buffer = readFileSync(graphicPath);
    const graphicUrl = await writeNomineeGraphicFile({
      categoryId: nominees.find((n) => n.id === best!.nomineeId)!.categoryId,
      nomineeId: best.nomineeId,
      buffer,
      fileName: "graphic.jpg",
    });

    const nominee = nominees.find((n) => n.id === best!.nomineeId)!;
    await saveNomineePageEntry(
      {
        nomineeId: best.nomineeId,
        categoryId: nominee.categoryId,
        nomineeGraphicMediaId: "",
        nomineeGraphicUrl: graphicUrl,
        displayOrder: entries.length + uploaded + 1,
        publishToNomineePage: false,
        status: "Draft",
        createdByName: "Screenshot Import",
        createdByEmail: "seed@setvawards.com",
      },
      entryIdByNominee.get(best.nomineeId) ?? `page_${best.nomineeId}`,
    );

    graphicByNominee.set(best.nomineeId, { nomineeGraphicUrl: graphicUrl });
    uploaded += 1;
    console.log(`  uploaded → ${graphicUrl}`);
  }

  console.log(`\n${APPLY ? "Uploaded" : "Matched"}: ${uploaded || "(dry run — see above)"}`);
  if (!APPLY) console.log("Re-run with --apply to upload graphics.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
