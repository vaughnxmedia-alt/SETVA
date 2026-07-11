import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/server";

const SPONSOR_ASSETS_BUCKET = "sponsor-assets";
const SPONSOR_ASSETS_FILE_SIZE_LIMIT = "50MB";
const SUPABASE_SPONSOR_ASSETS_MAX_BYTES = 50 * 1024 * 1024;
const SPONSOR_LOGO_MAX_BYTES = 10 * 1024 * 1024;
const SPONSOR_VIDEO_AD_MAX_BYTES = 200 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm"]);

export type SponsorAssetKind = "logo" | "video-ad";

export type StoredSponsorAsset = {
  url: string;
  fileName: string;
  originalName: string;
};

let s3Client: S3Client | null = null;

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

  const maxBytes =
    kind === "logo" ? SPONSOR_LOGO_MAX_BYTES : SPONSOR_VIDEO_AD_MAX_BYTES;
  if (size > maxBytes) {
    throw new Error(
      kind === "logo"
        ? "Sponsor logo must be 10MB or smaller."
        : "Sponsor video ad must be 200MB or smaller.",
    );
  }
}

function sponsorS3Config():
  | {
      bucket: string;
      region: string;
      publicBaseUrl: string;
    }
  | null {
  const bucket = process.env.AWS_S3_SPONSOR_ASSETS_BUCKET?.trim();
  const region =
    process.env.AWS_REGION?.trim() || process.env.AWS_DEFAULT_REGION?.trim();
  if (!bucket || !region) return null;

  const configuredBase = process.env.AWS_S3_SPONSOR_ASSETS_PUBLIC_BASE_URL
    ?.trim()
    .replace(/\/$/, "");
  const publicBaseUrl =
    configuredBase || `https://${bucket}.s3.${region}.amazonaws.com`;

  return { bucket, region, publicBaseUrl };
}

function getS3Client(region: string): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region,
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }
  return s3Client;
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

async function writeS3SponsorAsset(input: {
  objectPath: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  const config = sponsorS3Config();
  if (!config) {
    throw new Error(
      "Large sponsor video storage is not configured. Add AWS S3 sponsor asset env vars.",
    );
  }

  await getS3Client(config.region).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: input.objectPath,
      Body: input.buffer,
      ContentType: input.contentType,
    }),
  );

  return `${config.publicBaseUrl}/${input.objectPath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
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

  if (
    input.kind === "video-ad" &&
    input.buffer.byteLength > SUPABASE_SPONSOR_ASSETS_MAX_BYTES
  ) {
    const url = await writeS3SponsorAsset({
      objectPath,
      buffer: input.buffer,
      contentType,
    });

    return {
      url,
      fileName: filename,
      originalName: input.originalName,
    };
  }

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
