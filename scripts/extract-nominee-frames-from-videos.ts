/**
 * Extract nominee announcement frames from category videos.
 *
 * Usage:
 *   npx tsx scripts/extract-nominee-frames-from-videos.ts
 *   npx tsx scripts/extract-nominee-frames-from-videos.ts --apply
 *   npx tsx scripts/extract-nominee-frames-from-videos.ts --apply --force
 */
import { execFileSync } from "child_process";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { resolve } from "path";
import { pipeline } from "stream/promises";
import {
  cropToPortrait,
  isBusinessNominee,
  matchThresholdForNominee,
  ocrRegions,
  rawNameMatchScore,
} from "./nominee-frame-matching";

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");
const MISSING = process.argv.includes("--missing");
const ONLY = process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);
const NOMINEE_ID = process.argv.find((arg) => arg.startsWith("--nominee-id="))?.slice("--nominee-id=".length);

const OUT_DIR = resolve(process.cwd(), "nominee-frame-extracts");
const DOWNLOAD_DIR = resolve(process.cwd(), "facebook-downloads");
const GRAPHIC_WIDTH = 1080;
const GRAPHIC_HEIGHT = 1350;

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

const MAX_SCAN_SECONDS = 90;

function scanDurationSeconds(videoPath: string): number {
  return Math.min(videoDurationSeconds(videoPath), MAX_SCAN_SECONDS);
}

function videoDurationSeconds(videoPath: string): number {
  const output = execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ],
    { encoding: "utf8" },
  ).trim();
  const seconds = Number.parseFloat(output);
  return Number.isFinite(seconds) ? seconds : 8;
}

async function resolveVideoPath(categoryId: string, videoUrl: string): Promise<string> {
  const trimmed = videoUrl.trim();
  if (trimmed.startsWith("/")) {
    const localPath = resolve(process.cwd(), "public", trimmed.replace(/^\//, ""));
    if (existsSync(localPath)) return localPath;
  }

  const localPath = resolve(DOWNLOAD_DIR, `${categoryId}.mp4`);
  if (existsSync(localPath)) return localPath;

  if (!trimmed.startsWith("http")) {
    throw new Error(`Unsupported video URL: ${trimmed}`);
  }

  mkdirSync(DOWNLOAD_DIR, { recursive: true });
  const response = await fetch(trimmed);
  if (!response.ok || !response.body) {
    throw new Error(`Could not download video for ${categoryId}`);
  }
  await pipeline(response.body as unknown as NodeJS.ReadableStream, createWriteStream(localPath));
  return localPath;
}

function extractFrame(videoPath: string, timestamp: number, outputPath: string) {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-ss",
      String(timestamp),
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      outputPath,
    ],
    { stdio: "pipe" },
  );
}

type FramePick = {
  timestamp: number;
  ocrText: string;
  framePath: string;
  matchedNominee: { nomineeId: string; name: string; score: number } | null;
};

function pickBestFrame(
  videoPath: string,
  workDir: string,
  nominees: Array<{ id: string; name: string }>,
): FramePick {
  mkdirSync(workDir, { recursive: true });
  const duration = scanDurationSeconds(videoPath);
  const step = 0.5;
  let best: FramePick | null = null;

  for (let t = 0; t <= duration; t += step) {
    const framePath = resolve(workDir, `frame-${t.toFixed(1).replace(".", "_")}.jpg`);
    extractFrame(videoPath, t, framePath);
    const stamp = t.toFixed(1).replace(".", "_");
    const regions = ocrRegions(framePath, workDir, stamp);
    const ocrText = regions.combined;

    let topMatch: { nomineeId: string; name: string; score: number } | null = null;
    for (const nominee of nominees) {
      const score = rawNameMatchScore(regions, nominee.name);
      const threshold = matchThresholdForNominee(nominee.name);
      if (score < threshold) continue;
      if (!topMatch || score > topMatch.score) {
        topMatch = { nomineeId: nominee.id, name: nominee.name, score };
      }
    }

    const letters = ocrText.replace(/[^A-Za-z]/g, "").length;
    const rankScore = (topMatch?.score ?? 0) * 100 + Math.min(letters / 20, 2);
    const current: FramePick = {
      timestamp: t,
      ocrText,
      framePath,
      matchedNominee: topMatch,
    };

    const bestRank =
      (best?.matchedNominee?.score ?? 0) * 100 +
      Math.min((best?.ocrText.replace(/[^A-Za-z]/g, "").length ?? 0) / 20, 2);
    if (!best || rankScore > bestRank) best = current;
  }

  if (!best) throw new Error("No frames extracted");
  return best;
}

type NomineeFrameMatch = {
  videoLabel: string;
  timestamp: number;
  ocrText: string;
  framePath: string;
  score: number;
};

function findBestFrameForNominee(
  videoPath: string,
  videoLabel: string,
  workDir: string,
  nomineeName: string,
): NomineeFrameMatch | null {
  mkdirSync(workDir, { recursive: true });
  const duration = scanDurationSeconds(videoPath);
  const step = 0.5;
  let best: NomineeFrameMatch | null = null;

  for (let t = 0; t <= duration; t += step) {
    const framePath = resolve(workDir, `frame-${t.toFixed(1).replace(".", "_")}.jpg`);
    extractFrame(videoPath, t, framePath);
    const stamp = t.toFixed(1).replace(".", "_");
    const regions = ocrRegions(framePath, workDir, stamp);
    const score = rawNameMatchScore(regions, nomineeName);
    if (!best || score > best.score) {
      best = { videoLabel, timestamp: t, ocrText: regions.combined, framePath, score };
    }
  }

  const threshold = matchThresholdForNominee(nomineeName);
  return best && best.score >= threshold ? best : null;
}

function findBestFramesForAllNominees(
  videoPath: string,
  workDir: string,
  nominees: Array<{ id: string; name: string }>,
): Map<string, NomineeFrameMatch & { framePath: string }> {
  mkdirSync(workDir, { recursive: true });
  const duration = scanDurationSeconds(videoPath);
  const step = 0.5;
  const bestByNominee = new Map<string, NomineeFrameMatch & { framePath: string }>();

  for (let t = 0; t <= duration; t += step) {
    const framePath = resolve(workDir, `frame-${t.toFixed(1).replace(".", "_")}.jpg`);
    extractFrame(videoPath, t, framePath);
    const stamp = t.toFixed(1).replace(".", "_");
    const regions = ocrRegions(framePath, workDir, stamp);

    for (const nominee of nominees) {
      const score = rawNameMatchScore(regions, nominee.name);
      const threshold = matchThresholdForNominee(nominee.name);
      if (!Number.isFinite(score) || score < threshold) continue;
      const current = bestByNominee.get(nominee.id);
      if (!current || score > current.score) {
        bestByNominee.set(nominee.id, {
          videoLabel: "",
          timestamp: t,
          ocrText: regions.combined,
          framePath,
          score,
        });
      }
    }
  }

  return bestByNominee;
}

async function uploadNomineeGraphic(input: {
  categoryId: string;
  nomineeId: string;
  nomineeName: string;
  framePath: string;
  graphicByNominee: Map<string, { nomineeGraphicUrl?: string }>;
  entryIdByNominee: Map<string, string>;
  pageEntries: Array<{ nomineeId: string; displayOrder: number }>;
}): Promise<string | null> {
  const { writeNomineeGraphicFile } = await import("../src/lib/nomination-assets");
  const { saveNomineePageEntry } = await import("../src/lib/nominee-workflows-store");

  const existingGraphic = input.graphicByNominee.get(input.nomineeId);
  if (existingGraphic && !FORCE) return null;

  const outDir = resolve(OUT_DIR, input.categoryId, input.nomineeId);
  mkdirSync(outDir, { recursive: true });
  const portraitPath = resolve(outDir, "graphic.jpg");
  cropToPortrait(input.framePath, portraitPath);

  const buffer = readFileSync(portraitPath);
  const graphicUrl = await writeNomineeGraphicFile({
    categoryId: input.categoryId,
    nomineeId: input.nomineeId,
    buffer,
    fileName: "graphic.jpg",
    existingUrl: existingGraphic?.nomineeGraphicUrl,
  });

  const pageEntryId = input.entryIdByNominee.get(input.nomineeId) ?? `page_${input.nomineeId}`;
  await saveNomineePageEntry(
    {
      nomineeId: input.nomineeId,
      categoryId: input.categoryId,
      nomineeGraphicMediaId: "",
      nomineeGraphicUrl: graphicUrl,
      displayOrder:
        input.pageEntries.find((entry) => entry.nomineeId === input.nomineeId)?.displayOrder ?? 1,
      publishToNomineePage: false,
      status: "Draft",
      createdByName: "Video Frame Extract",
      createdByEmail: "seed@setvawards.com",
    },
    pageEntryId,
  );

  return graphicUrl;
}

async function extractMissingNominees() {
  const { listNomineeCategories } = await import("../src/lib/nominee-categories-store");
  const { listNominees } = await import("../src/lib/nominees-store");
  const { listNomineePageEntries } = await import("../src/lib/nominee-workflows-store");
  const { categoryIsSpecialAward } = await import("../src/lib/nominee-category-groups");

  const categories = await listNomineeCategories();
  const nominees = await listNominees();
  const pageEntries = await listNomineePageEntries();
  const graphicByNominee = new Map(
    pageEntries
      .filter((entry) => entry.nomineeGraphicUrl?.trim())
      .map((entry) => [entry.nomineeId, entry]),
  );
  const entryIdByNominee = new Map(pageEntries.map((entry) => [entry.nomineeId, entry.id]));

  const videoSources: Array<{ label: string; categoryId: string; path: string }> = [];
  for (const category of categories) {
    const url = category.videoUrl.trim();
    if (!url || url.startsWith("blob:") || categoryIsSpecialAward(category)) continue;
    try {
      const path = await resolveVideoPath(category.id, url);
      videoSources.push({ label: category.title, categoryId: category.id, path });
    } catch {
      // skip unavailable videos
    }
  }

  let targets = nominees.filter((nominee) => !graphicByNominee.has(nominee.id));
  if (NOMINEE_ID) targets = targets.filter((nominee) => nominee.id === NOMINEE_ID);
  if (ONLY) targets = targets.filter((nominee) => nominee.categoryId === ONLY);

  mkdirSync(OUT_DIR, { recursive: true });
  const report: Array<Record<string, unknown>> = [];
  let uploaded = 0;
  let notFound = 0;

  for (const nominee of targets) {
    console.log(`\n=== ${nominee.name} (${nominee.categoryId}) ===`);

    let bestMatch: (NomineeFrameMatch & { sourceCategoryId: string }) | null = null;
    for (const source of videoSources) {
      const workDir = resolve(OUT_DIR, "by-nominee", nominee.id, source.categoryId, "candidates");
      const match = findBestFrameForNominee(source.path, source.label, workDir, nominee.name);
      if (match && (!bestMatch || match.score > bestMatch.score)) {
        bestMatch = { ...match, sourceCategoryId: source.categoryId };
      }
    }

    if (!bestMatch) {
      console.log("  not found in any downloaded video");
      notFound += 1;
      report.push({
        nomineeId: nominee.id,
        nomineeName: nominee.name,
        categoryId: nominee.categoryId,
        found: false,
      });
      continue;
    }

    console.log(
      `  found in "${bestMatch.videoLabel}" @ ${bestMatch.timestamp.toFixed(1)}s (${(bestMatch.score * 100).toFixed(0)}%)`,
    );
    console.log(`  OCR: ${bestMatch.ocrText.slice(0, 100)}${bestMatch.ocrText.length > 100 ? "…" : ""}`);

    report.push({
      nomineeId: nominee.id,
      nomineeName: nominee.name,
      categoryId: nominee.categoryId,
      found: true,
      videoLabel: bestMatch.videoLabel,
      timestamp: bestMatch.timestamp,
      matchScore: bestMatch.score,
      ocrText: bestMatch.ocrText,
    });

    if (!APPLY) {
      console.log("  dry-run — would upload graphic");
      continue;
    }

    const graphicUrl = await uploadNomineeGraphic({
      categoryId: nominee.categoryId,
      nomineeId: nominee.id,
      nomineeName: nominee.name,
      framePath: bestMatch.framePath,
      graphicByNominee,
      entryIdByNominee,
      pageEntries,
    });
    if (graphicUrl) {
      uploaded += 1;
      graphicByNominee.set(nominee.id, { nomineeGraphicUrl: graphicUrl });
      console.log(`  uploaded → ${graphicUrl}`);
    }
  }

  writeFileSync(resolve(OUT_DIR, "missing-nominees-report.json"), JSON.stringify(report, null, 2));
  console.log("\n---");
  console.log(`${APPLY ? "Uploaded" : "Matched"}: ${APPLY ? uploaded : report.filter((r) => r.found).length}`);
  console.log(`Not found: ${notFound}`);
  console.log(`Report: ${resolve(OUT_DIR, "missing-nominees-report.json")}`);
}

async function main() {
  if (MISSING || NOMINEE_ID) {
    await extractMissingNominees();
    return;
  }
  const { listNomineeCategories } = await import("../src/lib/nominee-categories-store");
  const { listNominees } = await import("../src/lib/nominees-store");
  const { listNomineePageEntries, saveNomineePageEntry } = await import(
    "../src/lib/nominee-workflows-store"
  );
  const { writeNomineeGraphicFile } = await import("../src/lib/nomination-assets");
  const { categoryIsSpecialAward } = await import("../src/lib/nominee-category-groups");

  const categories = (await listNomineeCategories()).filter((category) => {
    const url = category.videoUrl.trim();
    return Boolean(url && !url.startsWith("blob:") && !categoryIsSpecialAward(category));
  });

  const nominees = await listNominees();
  const pageEntries = await listNomineePageEntries();
  const graphicByNominee = new Map(
    pageEntries
      .filter((entry) => entry.nomineeGraphicUrl?.trim())
      .map((entry) => [entry.nomineeId, entry]),
  );
  const entryIdByNominee = new Map(pageEntries.map((entry) => [entry.nomineeId, entry.id]));

  mkdirSync(OUT_DIR, { recursive: true });

  const report: Array<Record<string, unknown>> = [];
  let uploaded = 0;
  let skipped = 0;
  let unmatched = 0;

  for (const category of categories) {
    if (ONLY && category.id !== ONLY) continue;

    const categoryNominees = nominees.filter((nominee) => nominee.categoryId === category.id);
    if (categoryNominees.length === 0) {
      skipped += 1;
      continue;
    }

    console.log(`\n=== ${category.title} (${category.id}) ===`);

    try {
      const videoPath = await resolveVideoPath(category.id, category.videoUrl);
      const workDir = resolve(OUT_DIR, category.id, "candidates");
      const missingNominees = categoryNominees
        .filter((nominee) => FORCE || !graphicByNominee.has(nominee.id))
        .map((nominee) => ({ id: nominee.id, name: nominee.name }));

      if (missingNominees.length === 0) {
        console.log("  all nominees already have graphics");
        skipped += 1;
        continue;
      }

      const matches = findBestFramesForAllNominees(videoPath, workDir, missingNominees);
      console.log(`  scanned ${scanDurationSeconds(videoPath).toFixed(0)}s — matched ${matches.size}/${missingNominees.length} nominees`);

      for (const nominee of missingNominees) {
        const match = matches.get(nominee.id);
        if (!match) {
          console.log(`  no match: ${nominee.name}`);
          unmatched += 1;
          report.push({
            categoryId: category.id,
            categoryTitle: category.title,
            matchedNominee: nominee.name,
            matchedNomineeId: nominee.id,
            found: false,
          });
          continue;
        }

        console.log(
          `  match: ${nominee.name} @ ${match.timestamp.toFixed(1)}s (${(match.score * 100).toFixed(0)}%, ${isBusinessNominee(nominee.name) ? "logo/business" : "person"})`,
        );
        console.log(`  OCR: ${match.ocrText.slice(0, 100)}${match.ocrText.length > 100 ? "…" : ""}`);

        report.push({
          categoryId: category.id,
          categoryTitle: category.title,
          timestamp: match.timestamp,
          ocrText: match.ocrText,
          matchedNominee: nominee.name,
          matchedNomineeId: nominee.id,
          matchScore: match.score,
          nomineeCount: categoryNominees.length,
          found: true,
        });

        if (!APPLY) {
          console.log(`  dry-run — would upload graphic for ${nominee.name}`);
          continue;
        }

        const graphicUrl = await uploadNomineeGraphic({
          categoryId: category.id,
          nomineeId: nominee.id,
          nomineeName: nominee.name,
          framePath: match.framePath,
          graphicByNominee,
          entryIdByNominee,
          pageEntries,
        });
        if (graphicUrl) {
          uploaded += 1;
          graphicByNominee.set(nominee.id, { nomineeGraphicUrl: graphicUrl });
          console.log(`  uploaded → ${graphicUrl}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  failed: ${message}`);
      report.push({
        categoryId: category.id,
        categoryTitle: category.title,
        error: message,
      });
    }
  }

  writeFileSync(resolve(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));

  console.log("\n---");
  console.log(`${APPLY ? "Uploaded" : "Ready"}: ${APPLY ? uploaded : report.filter((r) => r.matchedNominee).length}`);
  console.log(`Unmatched: ${unmatched}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Review files: ${OUT_DIR}`);
  if (!APPLY) console.log("Run with --apply to upload matched graphics.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
