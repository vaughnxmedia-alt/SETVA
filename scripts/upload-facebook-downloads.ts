import { readFileSync, readdirSync, existsSync } from "fs";
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

async function main() {
  const ids = process.argv.slice(2);
  const downloadDir = resolve(process.cwd(), "facebook-downloads");

  const {
    writeCategoryVideoFile,
    writeCategoryPosterFile,
  } = await import("../src/lib/nomination-assets");
  const { listNomineeCategories, saveNomineeCategories, categoryTitleById } =
    await import("../src/lib/nominee-categories-store");

  const files =
    ids.length > 0
      ? ids.map((id) => resolve(downloadDir, `${id}.mp4`))
      : readdirSync(downloadDir)
          .filter((name) => name.endsWith(".mp4"))
          .map((name) => resolve(downloadDir, name));

  if (files.length === 0) {
    console.error("No mp4 files found in facebook-downloads/");
    process.exit(1);
  }

  const categories = await listNomineeCategories();
  const byId = new Map(categories.map((c) => [c.id, c]));

  for (const filePath of files) {
    if (!existsSync(filePath)) {
      console.error(`Missing file: ${filePath}`);
      continue;
    }

    const categoryId = filePath.split("/").pop()?.replace(/\.mp4$/, "") ?? "";
    const category = byId.get(categoryId);
    if (!category) {
      console.error(`Unknown category id: ${categoryId}`);
      continue;
    }

    const videoBuffer = readFileSync(filePath);
    console.log(`Uploading video: ${categoryTitleById(categories, categoryId)} (${categoryId})`);

    const videoUrl = await writeCategoryVideoFile({
      categoryId,
      buffer: videoBuffer,
      fileName: "video.mp4",
      existingUrl: category.videoUrl,
    });

    const posterBuffer = posterBufferFromVideo(filePath);
    const posterUrl = await writeCategoryPosterFile({
      categoryId,
      buffer: posterBuffer,
      fileName: "poster.jpg",
    });

    byId.set(categoryId, {
      ...category,
      videoUrl,
      videoPosterUrl: posterUrl,
    });

    console.log(`  video:  ${videoUrl}`);
    console.log(`  poster: ${posterUrl}`);
  }

  await saveNomineeCategories(Array.from(byId.values()));
  console.log("\nSaved categories to Supabase.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
