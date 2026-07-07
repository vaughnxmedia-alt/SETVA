/**
 * Re-encode category videos that use VP9 (or other non-H.264 codecs) to H.264
 * so they play on iPhone/Safari. Re-uploads to Supabase Storage and refreshes
 * posters. Hosting (Supabase vs S3) is not the issue — codec is.
 *
 * Usage:
 *   npx tsx scripts/transcode-category-videos-to-h264.ts           # dry run
 *   npx tsx scripts/transcode-category-videos-to-h264.ts --apply   # transcode + upload
 */
import { execFileSync } from "child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

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
const ONLY_ID = process.argv.find((a) => a.startsWith("--category="))?.slice("--category=".length);
const CRF = process.argv.find((a) => a.startsWith("--crf="))?.slice("--crf=".length) ?? "20";
const REFRESH_POSTERS = process.argv.includes("--refresh-posters");

function videoCodec(filePath: string): string {
  return execFileSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name", "-of", "csv=p=0", filePath],
    { encoding: "utf8" },
  ).trim();
}

function isWebSafeH264(codec: string): boolean {
  return codec === "h264" || codec === "avc1";
}

function transcodeToH264(inputPath: string, outputPath: string, crf = CRF) {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-vf",
      "scale='min(1280,iw)':-2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      crf,
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { stdio: "inherit" },
  );
}

function posterBufferFromVideo(videoPath: string): Buffer {
  const tmp = `${videoPath}.poster.jpg`;
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-ss", "1", "-i", videoPath, "-frames:v", "1", "-q:v", "2", tmp],
    { stdio: "pipe" },
  );
  return readFileSync(tmp);
}

async function main() {
  const { listNomineeCategories, saveNomineeCategories } = await import(
    "../src/lib/nominee-categories-store"
  );
  const { writeCategoryVideoFile, writeCategoryPosterFile } = await import(
    "../src/lib/nomination-assets"
  );

  const categories = await listNomineeCategories();
  const workDir = mkdtempSync(join(tmpdir(), "setva-vid-"));
  const updated = new Map(categories.map((c) => [c.id, c]));

  try {
    for (const category of categories) {
      if (ONLY_ID && category.id !== ONLY_ID) continue;
      const url = category.videoUrl?.trim() ?? "";
      if (!category.publishVideo || !url.startsWith("http")) continue;

      console.log(`\n${category.title}`);
      console.log(`  ${url}`);

      const inputPath = join(workDir, `${category.id}-src.mp4`);
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`  SKIP: download failed (${res.status})`);
        continue;
      }
      writeFileSync(inputPath, Buffer.from(await res.arrayBuffer()));

      let codec = videoCodec(inputPath);
      console.log(`  codec: ${codec}`);

      let uploadPath = inputPath;
      if (!isWebSafeH264(codec)) {
        if (!APPLY) {
          console.log(`  NEEDS transcode -> H.264 (dry run)`);
          continue;
        }
        const outPath = join(workDir, `${category.id}-h264.mp4`);
        transcodeToH264(inputPath, outPath);
        uploadPath = outPath;
        codec = videoCodec(outPath);
        console.log(`  transcoded -> ${codec}`);
      } else if (!APPLY) {
        console.log(`  OK: already H.264`);
        continue;
      } else if (REFRESH_POSTERS) {
        uploadPath = inputPath;
        console.log(`  refreshing poster only`);
      } else {
        console.log(`  OK: already H.264 (skipping re-upload)`);
        continue;
      }

      let videoUrl = category.videoUrl;
      if (!isWebSafeH264(videoCodec(inputPath)) || uploadPath !== inputPath) {
        const videoBuffer = readFileSync(uploadPath);
        videoUrl = await writeCategoryVideoFile({
          categoryId: category.id,
          buffer: videoBuffer,
          fileName: "video.mp4",
          existingUrl: category.videoUrl,
        });
      }
      const posterUrl = await writeCategoryPosterFile({
        categoryId: category.id,
        buffer: posterBufferFromVideo(uploadPath),
        fileName: "poster.jpg",
      });

      updated.set(category.id, {
        ...category,
        videoUrl,
        videoPosterUrl: posterUrl,
      });
      console.log(`  uploaded: ${videoUrl}`);
      if (APPLY) {
        await saveNomineeCategories(Array.from(updated.values()));
      }
    }

    if (APPLY) {
      console.log("\nSaved categories.");
    } else {
      console.log("\nDry run — re-run with --apply to transcode and upload.");
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
