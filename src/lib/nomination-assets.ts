import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/server";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);
const NOMINATION_ASSETS_BUCKET = "nomination-assets";
const NOMINATION_ASSETS_FILE_SIZE_LIMIT = "50MB";

function extensionFromName(filename: string, fallback: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext || fallback;
}

function publicUrl(categoryId: string, filename: string): string {
  return `/nominations/${categoryId}/${filename}`;
}

function contentTypeForExtension(ext: string): string {
  const types: Record<string, string> = {
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".mov": "video/quicktime",
    ".mp4": "video/mp4",
    ".png": "image/png",
    ".webm": "video/webm",
    ".webp": "image/webp",
  };
  return types[ext] ?? "application/octet-stream";
}

async function ensureNominationAssetsBucket() {
  const client = supabaseAdmin();
  if (!client) return null;

  const { data } = await client.storage.getBucket(NOMINATION_ASSETS_BUCKET);
  if (!data) {
    const { error } = await client.storage.createBucket(NOMINATION_ASSETS_BUCKET, {
      public: true,
      fileSizeLimit: NOMINATION_ASSETS_FILE_SIZE_LIMIT,
    });
    if (error) throw error;
  } else {
    const { error } = await client.storage.updateBucket(NOMINATION_ASSETS_BUCKET, {
      public: true,
      fileSizeLimit: NOMINATION_ASSETS_FILE_SIZE_LIMIT,
    });
    if (error) throw error;
  }

  return client;
}

async function removeMatchingObjects(categoryId: string, matcher: (filename: string) => boolean) {
  const client = supabaseAdmin();
  if (!client) return;

  const { data, error } = await client.storage.from(NOMINATION_ASSETS_BUCKET).list(categoryId);
  if (error || !data) return;

  const paths = data
    .map((object) => object.name)
    .filter(matcher)
    .map((filename) => `${categoryId}/${filename}`);

  if (paths.length) {
    await client.storage.from(NOMINATION_ASSETS_BUCKET).remove(paths);
  }
}

async function writeSupabasePublicFile(input: {
  categoryId: string;
  filename: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  const client = await ensureNominationAssetsBucket();
  if (!client) throw new Error("Nomination asset storage is not configured.");

  const objectPath = `${input.categoryId}/${input.filename}`;
  const { error } = await client.storage
    .from(NOMINATION_ASSETS_BUCKET)
    .upload(objectPath, input.buffer, {
      contentType: input.contentType,
      upsert: true,
    });

  if (error) throw error;

  const { data } = client.storage.from(NOMINATION_ASSETS_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
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

  let filename = `${nomineeId}${ext}`;
  const existingPath = input.existingUrl?.trim() ?? "";
  if (existingPath.startsWith(`/nominations/${categoryId}/`)) {
    filename = path.basename(existingPath);
  }

  if (isSupabaseConfigured()) {
    await removeMatchingObjects(
      categoryId,
      (file) => file === filename || file.startsWith(`${nomineeId}.`),
    );
    return writeSupabasePublicFile({
      categoryId,
      filename,
      buffer: input.buffer,
      contentType: contentTypeForExtension(ext),
    });
  }

  const categoryDir = path.join(process.cwd(), "public", "nominations", categoryId);
  await mkdir(categoryDir, { recursive: true });

  await removeMatchingFiles(categoryDir, (file) => file === filename || file.startsWith(`${nomineeId}.`));
  await writeFile(path.join(categoryDir, filename), input.buffer);

  return publicUrl(categoryId, filename);
}

export async function writeHonoreeGraphicFile(input: {
  slug: string;
  buffer: Buffer;
  fileName: string;
}): Promise<string> {
  const slug = input.slug.trim();
  if (!slug) throw new Error("Honoree slug is required.");

  const ext = extensionFromName(input.fileName, ".png");
  if (!IMAGE_EXTENSIONS.has(ext)) {
    throw new Error("Honoree graphic must be an image file.");
  }

  const filename = `${slug}${ext}`;

  if (isSupabaseConfigured()) {
    await removeMatchingObjects("honorees", (file) => file.startsWith(`${slug}.`));
    return writeSupabasePublicFile({
      categoryId: "honorees",
      filename,
      buffer: input.buffer,
      contentType: contentTypeForExtension(ext),
    });
  }

  const dir = path.join(process.cwd(), "public", "nominations", "honorees");
  await mkdir(dir, { recursive: true });
  await removeMatchingFiles(dir, (file) => file.startsWith(`${slug}.`));
  await writeFile(path.join(dir, filename), input.buffer);

  return publicUrl("honorees", filename);
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

  let filename = `video${ext}`;
  const existingPath = input.existingUrl?.trim() ?? "";
  if (existingPath.startsWith(`/nominations/${categoryId}/`)) {
    filename = path.basename(existingPath);
  }

  if (isSupabaseConfigured()) {
    await removeMatchingObjects(
      categoryId,
      (file) => file === filename || file.startsWith("video."),
    );
    return writeSupabasePublicFile({
      categoryId,
      filename,
      buffer: input.buffer,
      contentType: contentTypeForExtension(ext),
    });
  }

  const categoryDir = path.join(process.cwd(), "public", "nominations", categoryId);
  await mkdir(categoryDir, { recursive: true });

  await removeMatchingFiles(
    categoryDir,
    (file) => file === filename || file.startsWith("video."),
  );
  await writeFile(path.join(categoryDir, filename), input.buffer);

  return publicUrl(categoryId, filename);
}

export async function writeCategoryPosterFile(input: {
  categoryId: string;
  buffer: Buffer;
  fileName: string;
}): Promise<string> {
  const categoryId = input.categoryId.trim();
  if (!categoryId) throw new Error("Category is required.");

  const ext = extensionFromName(input.fileName, ".jpg");
  if (!IMAGE_EXTENSIONS.has(ext)) {
    throw new Error("Video thumbnail must be an image file.");
  }

  const filename = `poster${ext}`;

  if (isSupabaseConfigured()) {
    await removeMatchingObjects(categoryId, (file) => file.startsWith("poster."));
    return writeSupabasePublicFile({
      categoryId,
      filename,
      buffer: input.buffer,
      contentType: contentTypeForExtension(ext),
    });
  }

  const categoryDir = path.join(process.cwd(), "public", "nominations", categoryId);
  await mkdir(categoryDir, { recursive: true });

  await removeMatchingFiles(categoryDir, (file) => file.startsWith("poster."));
  await writeFile(path.join(categoryDir, filename), input.buffer);

  return publicUrl(categoryId, filename);
}
