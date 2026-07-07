/**
 * Shared OCR + name matching for nominee frames (people and business logos).
 */
import { execFileSync } from "child_process";
import { mkdirSync } from "fs";
import { resolve } from "path";

export const MATCH_THRESHOLD_PERSON = 0.45;
export const MATCH_THRESHOLD_BUSINESS = 0.35;

const BUSINESS_HINT =
  /\b(llc|inc|ltd|corp|co\.|service|services|productions?|media|studio|store|company|group|touch|clothing|nutrition|herbal|cleansing|beauty|body|financial|tax|podcast|alliance|collection|brand|salon|bar|cafe|shop|market|foundation|center|centre|therapy|wellness|design|entertainment)\b/i;

const BUSINESS_STOPWORDS = new Set([
  "the",
  "and",
  "llc",
  "inc",
  "ltd",
  "corp",
  "co",
  "service",
  "services",
  "production",
  "productions",
  "media",
  "studio",
  "store",
  "company",
  "group",
  "touch",
  "clothing",
  "nutrition",
  "herbal",
  "cleansing",
  "beauty",
  "body",
  "financial",
  "tax",
  "of",
  "year",
  "nominee",
  "nominees",
  "awards",
  "visionary",
  "southeast",
  "texas",
]);

export function ocrNormalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/4/g, "a")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeName(value: string): string {
  return ocrNormalize(value);
}

export function isBusinessNominee(name: string): boolean {
  if (BUSINESS_HINT.test(name)) return true;
  if (/[/&]/.test(name)) return true;
  if (/\b(and|studio|store|media|productions?)\b/i.test(name)) return true;
  const tokens = normalizeName(name).split(" ").filter((t) => t.length > 2);
  if (tokens.length >= 3 && !/^[a-z]+ [a-z]+$/.test(tokens.slice(0, 2).join(" "))) return true;
  return false;
}

const MATCH_STOPWORDS = new Set([
  ...BUSINESS_STOPWORDS,
  "south",
  "east",
  "north",
  "west",
  "best",
  "digital",
  "content",
  "creator",
  "social",
  "influencer",
  "director",
  "actor",
  "actress",
  "poet",
  "comedian",
  "media",
  "film",
  "music",
  "breakthrough",
  "collab",
  "studio",
  "dj",
  "rnb",
  "soul",
  "gospel",
  "hip",
  "hop",
  "rap",
  "latino",
  "album",
  "band",
  "song",
  "writer",
  "producer",
  "video",
  "podcast",
  "photographer",
  "videographer",
  "barber",
  "hairstylist",
  "makeup",
  "artist",
  "fashion",
  "designer",
  "brand",
  "wellness",
  "wellness",
  "wellness",
  "health",
  "small",
  "business",
  "supporting",
  "lifetime",
  "legacy",
  "visionary",
  "pillar",
  "stewardship",
  "youth",
  "impact",
  "community",
  "leader",
  "project",
  "architect",
  "watchlist",
  "valor",
  "spirit",
  "innovator",
]);

export function tokenSet(value: string, business = false): Set<string> {
  const tokens = normalizeName(value)
    .split(" ")
    .filter(
      (token) =>
        token.length > 2 &&
        !(business && BUSINESS_STOPWORDS.has(token)) &&
        !MATCH_STOPWORDS.has(token),
    );
  return new Set(tokens);
}

export function tokensSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 5 && b.length >= 5) {
    if (a.startsWith(b.slice(0, 5)) || b.startsWith(a.slice(0, 5))) return true;
  }
  if (a.length < 5 || b.length < 5) return false;
  let edits = 0;
  const max = Math.max(a.length, b.length);
  const min = Math.min(a.length, b.length);
  if (max - min > 2) return false;
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 2) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return edits + (a.length - b.length + (b.length - a.length)) <= 2;
}

export function nomineeNameVariants(name: string): string[] {
  const parts = name
    .split(/[/,&]|(?:\band\b)/i)
    .map((part) => part.trim())
    .filter(Boolean);
  const paren = name.match(/\(([^)]+)\)/);
  if (paren?.[1]?.trim()) parts.push(paren[1].trim());
  const withoutThe = name.replace(/^the\s+/i, "").trim();
  if (withoutThe && withoutThe !== name) parts.push(withoutThe);
  return [...new Set([name, ...parts])];
}

function scoreOcrAgainstName(ocrText: string, nomineeName: string, business: boolean): number {
  let best = 0;
  const ocr = normalizeName(ocrText);
  for (const variant of nomineeNameVariants(nomineeName)) {
    const name = normalizeName(variant);
    if (!ocr || !name) continue;
    if (ocr.includes(name) || name.includes(ocr)) {
      best = Math.max(best, 1);
      continue;
    }
    const ocrCompact = ocr.replace(/\s/g, "");
    const nameCompact = name.replace(/\s/g, "");
    if (
      ocrCompact.length > 0 &&
      nameCompact.length > 3 &&
      (ocrCompact.includes(nameCompact) || nameCompact.includes(ocrCompact))
    ) {
      best = Math.max(best, 0.95);
      continue;
    }

    const ocrTokens = [...tokenSet(ocrText, business)];
    const nameTokens = [...tokenSet(variant, business)];
    if (ocrTokens.length === 0 || nameTokens.length === 0) continue;

    let overlap = 0;
    for (const token of nameTokens) {
      if (ocrTokens.some((ocrToken) => tokensSimilar(ocrToken, token))) overlap += 1;
    }
    best = Math.max(best, overlap / nameTokens.length);

    // Brand logos often show one distinctive word (VEEDANS, LIVOL, KAYLA).
    const distinctive = nameTokens.filter((t) => t.length >= 5);
    if (distinctive.some((t) => ocrTokens.some((o) => tokensSimilar(o, t)))) {
      best = Math.max(best, 0.72);
    }
  }
  return best;
}

export type OcrRegionText = {
  combined: string;
  logo: string;
  banner: string;
  bottom: string;
  top: string;
};

export function rawNameMatchScore(
  regions: OcrRegionText | string,
  nomineeName: string,
): number {
  const business = isBusinessNominee(nomineeName);

  if (typeof regions === "string") {
    return scoreOcrAgainstName(regions, nomineeName, business);
  }

  const logoScore = scoreOcrAgainstName(regions.logo, nomineeName, true);
  const bannerScore = scoreOcrAgainstName(regions.banner, nomineeName, business);
  const bottomScore = scoreOcrAgainstName(regions.bottom, nomineeName, business);
  const combinedScore = scoreOcrAgainstName(regions.combined, nomineeName, business);

  if (business) {
    return Math.max(logoScore * 2.2, bannerScore * 1.8, bottomScore * 1.4, combinedScore);
  }
  return Math.max(bannerScore * 2, bottomScore * 1.6, combinedScore, logoScore);
}

export function nameMatchScore(
  regions: OcrRegionText | string,
  nomineeName: string,
): number {
  const score = rawNameMatchScore(regions, nomineeName);
  if (!Number.isFinite(score) || score < matchThresholdForNominee(nomineeName)) return 0;
  return score;
}

export function categoryKeywords(categoryTitle: string): string[] {
  return normalizeName(categoryTitle)
    .split(" ")
    .filter((t) => t.length > 3 && !MATCH_STOPWORDS.has(t) && !BUSINESS_STOPWORDS.has(t));
}

export function categoryHintScore(regions: OcrRegionText, categoryTitle: string): number {
  const banner = normalizeName(`${regions.banner} ${regions.bottom}`);
  const keywords = categoryKeywords(categoryTitle);
  if (keywords.length === 0) return 0;
  let hits = 0;
  for (const keyword of keywords) {
    if (banner.includes(keyword)) hits += 1;
  }
  return hits / keywords.length;
}

export function matchThresholdForNominee(nomineeName: string): number {
  return isBusinessNominee(nomineeName) ? MATCH_THRESHOLD_BUSINESS : MATCH_THRESHOLD_PERSON;
}

export function ocrImage(imagePath: string): string {
  try {
    return execFileSync("tesseract", [imagePath, "stdout", "-l", "eng", "--psm", "6"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

function cropRegion(inputPath: string, outputPath: string, filter: string) {
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", inputPath, "-vf", filter, outputPath],
    { stdio: "pipe" },
  );
}

/** OCR regions tuned for SETVA nominee slides (logo center + name banner). */
export function ocrRegions(framePath: string, workDir: string, stamp: string): OcrRegionText {
  mkdirSync(workDir, { recursive: true });
  const logoPath = resolve(workDir, `ocr-logo-${stamp}.jpg`);
  const bannerPath = resolve(workDir, `ocr-banner-${stamp}.jpg`);
  const bottomPath = resolve(workDir, `ocr-bottom-${stamp}.jpg`);
  const topPath = resolve(workDir, `ocr-top-${stamp}.jpg`);

  cropRegion(framePath, logoPath, "crop=iw:ih*0.55:0:ih*0.18");
  cropRegion(framePath, bannerPath, "crop=iw:ih*0.22:0:ih*0.72");
  cropRegion(framePath, bottomPath, "crop=iw:ih*0.34:0:ih*0.66");
  cropRegion(framePath, topPath, "crop=iw:ih*0.22:0:0");

  const logo = ocrImage(logoPath);
  const banner = ocrImage(bannerPath);
  const bottom = ocrImage(bottomPath);
  const top = ocrImage(topPath);
  const full = ocrImage(framePath);

  return {
    logo,
    banner,
    bottom,
    top,
    combined: [logo, banner, bottom, top, full].filter(Boolean).join(" "),
  };
}

/** Strip Facebook/phone chrome from a screenshot before cropping the nominee slide. */
export function cropPosterFromScreenshot(inputPath: string, outputPath: string) {
  cropRegion(inputPath, outputPath, "crop=iw:ih*0.66:0:ih*0.12");
}

export function cropToPortrait(
  inputPath: string,
  outputPath: string,
  width = 1080,
  height = 1350,
) {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-vf",
      `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
      "-q:v",
      "2",
      outputPath,
    ],
    { stdio: "pipe" },
  );
}
