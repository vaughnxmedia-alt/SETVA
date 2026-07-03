import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { execFileSync } from "child_process";

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

function posterBufferFromVideo(videoPath: string): Buffer {
  const tmp = `${videoPath}.poster.jpg`;
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-ss", "1", "-i", videoPath, "-frames:v", "1", "-q:v", "2", tmp],
    { stdio: "pipe" },
  );
  return readFileSync(tmp);
}

function localVideoPath(categoryId: string): string | null {
  const path = resolve(process.cwd(), "public", "nominations", categoryId, "video.mp4");
  return existsSync(path) ? path : null;
}

const LIVE_CATEGORY_IDS = [
  "artist-of-the-year",
  "album-of-the-year",
  "band-of-the-year",
  "best-collaboration",
  "breakthrough-artist-of-the-year",
];

async function main() {
  const { writeCategoryPosterFile } = await import("../src/lib/nomination-assets");
  const { listNomineeCategories, saveNomineeCategories, categoryTitleById } =
    await import("../src/lib/nominee-categories-store");

  const categories = await listNomineeCategories();
  const byId = new Map(categories.map((c) => [c.id, c]));

  for (const categoryId of LIVE_CATEGORY_IDS) {
    const category = byId.get(categoryId);
    if (!category) {
      console.error(`Category not found: ${categoryId}`);
      continue;
    }

    const videoPath = localVideoPath(categoryId);
    if (!videoPath) {
      console.error(`No local video for ${categoryId}`);
      continue;
    }

    console.log(`Poster: ${categoryTitleById(categories, categoryId)}`);
    const posterBuffer = posterBufferFromVideo(videoPath);
    const posterUrl = await writeCategoryPosterFile({
      categoryId,
      buffer: posterBuffer,
      fileName: "poster.jpg",
    });

    byId.set(categoryId, { ...category, videoPosterUrl: posterUrl });
    console.log(`  ${posterUrl}`);
  }

  const saved = await saveNomineeCategories(Array.from(byId.values()));
  console.log("\nSaved. Top of categories page:");
  saved.slice(0, 10).forEach((c, i) => {
    const done = c.videoUrl && c.videoPosterUrl ? "COMPLETE" : "—";
    console.log(`  ${i + 1}. ${c.title}  [${done}]`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
