import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path from "path";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

function extensionFromName(filename: string, fallback: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext || fallback;
}

function publicUrl(categoryId: string, filename: string): string {
  return `/nominations/${categoryId}/${filename}`;
}

async function removeMatchingFiles(categoryDir: string, matcher: (filename: string) => boolean) {
  let files: string[] = [];
  try {
    files = await readdir(categoryDir);
  } catch {
    return;
  }

  await Promise.all(
    files
      .filter((file) => matcher(file))
      .map((file) => unlink(path.join(categoryDir, file)).catch(() => undefined)),
  );
}

export async function writeNomineeGraphicFile(input: {
  categoryId: string;
  nomineeId: string;
  buffer: Buffer;
  fileName: string;
  existingUrl?: string;
}): Promise<string> {
  const categoryId = input.categoryId.trim();
  const nomineeId = input.nomineeId.trim();
  if (!categoryId || !nomineeId) {
    throw new Error("Category and nominee are required.");
  }

  const ext = extensionFromName(input.fileName, ".png");
  if (!IMAGE_EXTENSIONS.has(ext)) {
    throw new Error("Nominee graphic must be an image file.");
  }

  const categoryDir = path.join(process.cwd(), "public", "nominations", categoryId);
  await mkdir(categoryDir, { recursive: true });

  let filename = `${nomineeId}${ext}`;
  const existingPath = input.existingUrl?.trim() ?? "";
  if (existingPath.startsWith(`/nominations/${categoryId}/`)) {
    filename = path.basename(existingPath);
  }

  await removeMatchingFiles(categoryDir, (file) => file === filename || file.startsWith(`${nomineeId}.`));
  await writeFile(path.join(categoryDir, filename), input.buffer);

  return publicUrl(categoryId, filename);
}

export async function writeCategoryVideoFile(input: {
  categoryId: string;
  buffer: Buffer;
  fileName: string;
  existingUrl?: string;
}): Promise<string> {
  const categoryId = input.categoryId.trim();
  if (!categoryId) throw new Error("Category is required.");

  const ext = extensionFromName(input.fileName, ".mp4");
  if (!VIDEO_EXTENSIONS.has(ext)) {
    throw new Error("Category video must be a video file.");
  }

  const categoryDir = path.join(process.cwd(), "public", "nominations", categoryId);
  await mkdir(categoryDir, { recursive: true });

  let filename = `video${ext}`;
  const existingPath = input.existingUrl?.trim() ?? "";
  if (existingPath.startsWith(`/nominations/${categoryId}/`)) {
    filename = path.basename(existingPath);
  }

  await removeMatchingFiles(
    categoryDir,
    (file) => file === filename || file.startsWith("video."),
  );
  await writeFile(path.join(categoryDir, filename), input.buffer);

  return publicUrl(categoryId, filename);
}
