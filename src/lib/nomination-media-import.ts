import type { NomineeCategory } from "@/lib/nominees";

export type NominationMediaFile = {
  name: string;
  kind: "video" | "image" | "manifest" | "other";
  extension: string;
};

export type NominationMediaImportRow = {
  categoryTitle: string;
  categoryId: string;
  videoFileName: string;
  graphicFileName: string;
  nomineeName: string;
  publishCategoryVideo: boolean;
  publishNominee: boolean;
};

export type NominationMediaParseResult = {
  rows: NominationMediaImportRow[];
  unmatchedVideos: string[];
  unmatchedImages: string[];
  errors: string[];
};

const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

export function classifyNominationMediaFile(name: string): NominationMediaFile {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXTENSIONS.has(extension)) {
    return { name, kind: "video", extension };
  }
  if (IMAGE_EXTENSIONS.has(extension)) {
    return { name, kind: "image", extension };
  }
  if (extension === "csv") {
    return { name, kind: "manifest", extension };
  }
  return { name, kind: "other", extension };
}

export function titleFromMediaFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  return base
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      if (["of", "the", "and"].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .replace(/\bOf\b/g, "of")
    .replace(/\bThe\b/g, "the")
    .replace(/\bAnd\b/g, "and")
    .replace(/^of /i, "Of ")
    .replace(/^the /i, "The ")
    .replace(/ of the year$/i, " of the Year")
    .replace(/ award$/i, " Award")
    .replace(/ pics$/i, "")
    .trim();
}

export function slugifyNominationCategory(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeMatchKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bof the year\b/g, "")
    .replace(/\baward\b/g, "")
    .replace(/\bpics?\b/g, "")
    .replace(/\bvideo\b/g, "")
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeMatchKey(value).split(/\s+/).filter(Boolean));
}

function matchScore(a: string, b: string): number {
  const aTokens = tokenSet(a);
  const bTokens = tokenSet(b);
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }

  return overlap / Math.max(aTokens.size, bTokens.size);
}

function bestImageForCategory(
  categoryTitle: string,
  images: string[],
  used: Set<string>,
): string {
  let best = "";
  let bestScore = 0;

  for (const image of images) {
    if (used.has(image)) continue;
    const score = matchScore(categoryTitle, titleFromMediaFilename(image));
    if (score > bestScore) {
      bestScore = score;
      best = image;
    }
  }

  return bestScore >= 0.34 ? best : "";
}

export function parseNominationMediaManifest(
  csv: string,
  files: NominationMediaFile[],
): NominationMediaParseResult {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], unmatchedVideos: [], unmatchedImages: [], errors: ["Manifest is empty."] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const categoryIndex = findHeader(headers, ["category", "category name", "award category"]);
  const videoIndex = findHeader(headers, ["category video", "video", "video file", "category video file"]);
  const graphicIndex = findHeader(headers, [
    "nominee graphic",
    "graphic",
    "graphic file",
    "image",
    "image file",
  ]);
  const nomineeIndex = findHeader(headers, ["nominee", "nominee name", "name"]);
  const publishVideoIndex = findHeader(headers, ["publish category video", "publish video"]);
  const publishNomineeIndex = findHeader(headers, ["publish nominee", "publish"]);

  if (categoryIndex === -1) {
    return {
      rows: [],
      unmatchedVideos: [],
      unmatchedImages: [],
      errors: ["Manifest must include a Category column."],
    };
  }

  const fileNames = new Set(files.map((file) => file.name));
  const rows: NominationMediaImportRow[] = [];
  const errors: string[] = [];
  const usedVideos = new Set<string>();
  const usedImages = new Set<string>();

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const cells = parseCsvLine(lines[lineIndex]);
    const categoryTitle = (cells[categoryIndex] ?? "").trim();
    if (!categoryTitle) continue;

    const videoFileName = valueAt(cells, videoIndex);
    const graphicFileName = valueAt(cells, graphicIndex);
    const nomineeName = valueAt(cells, nomineeIndex);

    if (videoFileName && !fileNames.has(videoFileName)) {
      errors.push(`Row ${lineIndex + 1}: video file "${videoFileName}" was not uploaded.`);
    }
    if (graphicFileName && !fileNames.has(graphicFileName)) {
      errors.push(`Row ${lineIndex + 1}: graphic file "${graphicFileName}" was not uploaded.`);
    }

    if (videoFileName) usedVideos.add(videoFileName);
    if (graphicFileName) usedImages.add(graphicFileName);

    rows.push({
      categoryTitle,
      categoryId: slugifyNominationCategory(categoryTitle),
      videoFileName,
      graphicFileName,
      nomineeName,
      publishCategoryVideo: shouldPublish(valueAt(cells, publishVideoIndex), true),
      publishNominee: shouldPublish(valueAt(cells, publishNomineeIndex), true),
    });
  }

  const unmatchedVideos = files
    .filter((file) => file.kind === "video" && !usedVideos.has(file.name))
    .map((file) => file.name);
  const unmatchedImages = files
    .filter((file) => file.kind === "image" && !usedImages.has(file.name))
    .map((file) => file.name);

  return { rows, unmatchedVideos, unmatchedImages, errors };
}

export function parseNominationMediaFiles(
  files: NominationMediaFile[],
  existingCategories: NomineeCategory[] = [],
): NominationMediaParseResult {
  const videos = files.filter((file) => file.kind === "video").map((file) => file.name);
  const images = files.filter((file) => file.kind === "image").map((file) => file.name);
  const manifest = files.find((file) => file.kind === "manifest");

  if (manifest) {
    return {
      rows: [],
      unmatchedVideos: videos,
      unmatchedImages: images,
      errors: ["Upload the manifest CSV contents separately for preview."],
    };
  }

  const usedImages = new Set<string>();
  const rows: NominationMediaImportRow[] = [];

  for (const videoFileName of videos) {
    const categoryTitle = titleFromMediaFilename(videoFileName);
    const graphicFileName = bestImageForCategory(categoryTitle, images, usedImages);
    if (graphicFileName) usedImages.add(graphicFileName);

    rows.push({
      categoryTitle,
      categoryId: resolveCategoryIdForImport(categoryTitle, existingCategories),
      videoFileName,
      graphicFileName,
      nomineeName: "",
      publishCategoryVideo: true,
      publishNominee: true,
    });
  }

  for (const imageFileName of images) {
    if (usedImages.has(imageFileName)) continue;

    const categoryTitle = titleFromMediaFilename(imageFileName);
    rows.push({
      categoryTitle,
      categoryId: resolveCategoryIdForImport(categoryTitle, existingCategories),
      videoFileName: "",
      graphicFileName: imageFileName,
      nomineeName: "",
      publishCategoryVideo: false,
      publishNominee: true,
    });
    usedImages.add(imageFileName);
  }

  const unmatchedVideos: string[] = [];
  const unmatchedImages = images.filter((name) => !rows.some((row) => row.graphicFileName === name));

  return { rows, unmatchedVideos, unmatchedImages, errors: [] };
}

export function resolveCategoryIdForImport(
  title: string,
  existingCategories: NomineeCategory[],
): string {
  const lower = title.toLowerCase();
  const byTitle = existingCategories.find((category) => category.title.toLowerCase() === lower);
  if (byTitle) return byTitle.id;

  const byKey = existingCategories.find(
    (category) => normalizeMatchKey(category.title) === normalizeMatchKey(title),
  );
  if (byKey) return byKey.id;

  return slugifyNominationCategory(title);
}

export const nominationMediaManifestTemplate = [
  "Category,Category Video,Nominee Graphic,Nominee,Publish Category Video,Publish Nominee",
  'Community Leader of the Year,COMMUNITY LEADER OF THE YEAR.mp4,COMUNITY LEADER.png,"Raymond Louis and Stacy Wagner Louis",Yes,Yes',
  "Legacy Award,LEGACY AWARD.mp4,LEGACY AWARD.png,Barbara Lynn,Yes,Yes",
  "Life Time Achievement Award,LIFE TIME ACHIEVEMENT AWARD.mp4,LIFE TIME PICS.png,Benjamin Ben Collins Sr,Yes,Yes",
  "Visionary of the Year,VISIONARY OF THE YEAR.mp4,VISIONARY.png,Quin Gregory,Yes,Yes",
  "Youth Impact of the Year,YOUTH IMPACT AWARD.mp4,YOUTH IMPACT OF THE YEAR .png,One Nation of Southeast Texas,Yes,Yes",
  "Flava Band of the Year,,FLAVA BAND OF THE YEAR.png,The Flava Band,No,Yes",
].join("\n");

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function findHeader(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

function valueAt(cells: string[], index: number): string {
  return index === -1 ? "" : (cells[index] ?? "").trim();
}

function shouldPublish(value: string, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return ["yes", "true", "published", "publish", "1"].includes(value.trim().toLowerCase());
}
