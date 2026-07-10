import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/server";

const SPONSOR_ASSETS_BUCKET = "sponsor-assets";
const SPONSOR_ASSETS_FILE_SIZE_LIMIT = "250MB";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm"]);

export type SponsorAssetKind = "logo" | "video-ad";

export type StoredSponsorAsset = {
  url: string;
  fileName: string;
  originalName: string;
};

function extensionFromName(filename: string): string {
  return path.extname(filename).toLowerCase();
}

function contentTypeForExtension(ext: string): string {
  const types: Record<string, string> = {
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".mov": "video/quicktime",
    ".mp4": "video/mp4",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webm": "video/webm",
    ".webp": "image/webp",
  };
  return types[ext] ?? "application/octet-stream";
}

function safeSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "sponsor"
  );
}

function assertAllowedFile(kind: SponsorAssetKind, filename: string, size: number) {
  const ext = extensionFromName(filename);
  if (kind === "logo" && !IMAGE_EXTENSIONS.has(ext)) {
    throw new Error("Sponsor logo must be a PNG, JPG, WebP, or SVG file.");
  }
  if (kind === "video-ad" && !VIDEO_EXTENSIONS.has(ext)) {
    throw new Error("Sponsor video ad must be an MP4, MOV, or WebM file.");
  }

  const maxBytes = kind === "logo" ? 10 * 1024 * 1024 : 200 * 1024 * 1024;
  if (size > maxBytes) {
    throw new Error(
      kind === "logo"
        ? "Sponsor logo must be 10MB or smaller."
        : "Sponsor video ad must be 200MB or smaller.",
    );
  }
}

async function ensureSponsorAssetsBucket() {
  const client = supabaseAdmin();
  if (!client) return null;

  const { data } = await client.storage.getBucket(SPONSOR_ASSETS_BUCKET);
  if (!data) {
    const { error } = await client.storage.createBucket(SPONSOR_ASSETS_BUCKET, {
      public: true,
      fileSizeLimit: SPONSOR_ASSETS_FILE_SIZE_LIMIT,
    });
    if (error) throw error;
  } else {
    const { error } = await client.storage.updateBucket(SPONSOR_ASSETS_BUCKET, {
      public: true,
      fileSizeLimit: SPONSOR_ASSETS_FILE_SIZE_LIMIT,
    });
    if (error) throw error;
  }

  return client;
}

export async function writeSponsorAsset(input: {
  kind: SponsorAssetKind;
  companyName: string;
  packageId: string;
  originalName: string;
  buffer: Buffer;
}): Promise<StoredSponsorAsset> {
  assertAllowedFile(input.kind, input.originalName, input.buffer.byteLength);

  const ext = extensionFromName(input.originalName);
  const filename = `${Date.now()}-${input.kind}${ext}`;
  const sponsorDir = `${safeSlug(input.companyName)}-${safeSlug(input.packageId)}`;
  const objectPath = `${sponsorDir}/${filename}`;
  const contentType = contentTypeForExtension(ext);

  if (isSupabaseConfigured()) {
    const client = await ensureSponsorAssetsBucket();
    if (!client) throw new Error("Sponsor asset storage is not configured.");

    const { error } = await client.storage
      .from(SPONSOR_ASSETS_BUCKET)
      .upload(objectPath, input.buffer, {
        contentType,
        upsert: false,
      });
    if (error) throw error;

    const { data } = client.storage
      .from(SPONSOR_ASSETS_BUCKET)
      .getPublicUrl(objectPath);

    return {
      url: data.publicUrl,
      fileName: filename,
      originalName: input.originalName,
    };
  }

  const dir = path.join(process.cwd(), "public", "sponsor-assets", sponsorDir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), input.buffer);

  return {
    url: `/sponsor-assets/${sponsorDir}/${filename}`,
    fileName: filename,
    originalName: input.originalName,
  };
}
