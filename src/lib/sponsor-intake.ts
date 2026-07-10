import { createHmac, timingSafeEqual } from "crypto";
import { assertPackageAvailable, isPackageSoldOut } from "@/lib/sponsor-inventory";
import {
  sortSponsorPackagesByPrice,
  sponsorPackages,
  type SponsorPackage,
} from "@/lib/site";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEV_FALLBACK_SECRET = "setva-dev-intake-secret-do-not-use-in-production";

export const availableAssets = [
  "High-resolution logo",
  "Commercial or promotional video",
] as const;

export const PAY_BY_CHECK_OR_MONEY_ORDER =
  "Pay by check or money order" as const;
export const PAY_BY_CHECK_OR_MONEY_ORDER_MEETING =
  "Pay by check or money order — schedule pickup meeting" as const;
export const PAY_ELECTRONICALLY = "Pay electronically" as const;

export const preferredPaymentOptions = [
  PAY_ELECTRONICALLY,
  PAY_BY_CHECK_OR_MONEY_ORDER,
  PAY_BY_CHECK_OR_MONEY_ORDER_MEETING,
] as const;

export type OfflinePaymentMethod = "check" | "meeting";

export function paymentUsesSquare(payment: string): boolean {
  return payment === PAY_ELECTRONICALLY || payment === "Pay electronically (Square)";
}

export function getOfflinePaymentMethod(
  payment: string,
): OfflinePaymentMethod | null {
  if (payment === PAY_BY_CHECK_OR_MONEY_ORDER) return "check";
  if (payment === PAY_BY_CHECK_OR_MONEY_ORDER_MEETING) return "meeting";
  return null;
}

export type SponsorIntakeData = {
  packageId: string;
  categorySponsorshipCategoryId: string;
  categorySponsorshipCategoryTitle: string;
  companyName: string;
  contactName: string;
  jobTitle: string;
  email: string;
  phone: string;
  website: string;
  companyDescription: string;
  socialMedia: string;
  industry: string;
  preferredPayment: string;
  meetingNotes: string;
  primaryGoals: string[];
  activationInterests: string[];
  availableAssets: string[];
  logoAssetUrl: string;
  logoAssetName: string;
  videoAdAssetUrl: string;
  videoAdAssetName: string;
  authorized: boolean;
  exclusivityAcknowledged: boolean;
  availabilityAcknowledged: boolean;
};

export type SponsorIntakeRecord = SponsorIntakeData & {
  submittedAt: number;
  exp: number;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function purchasableSponsorPackages(): SponsorPackage[] {
  return sortSponsorPackagesByPrice(
    sponsorPackages.filter((pkg) => pkg.price > 0 && !pkg.contactOnly),
  );
}

export function availableSponsorPackages(): SponsorPackage[] {
  return purchasableSponsorPackages().filter((pkg) => !isPackageSoldOut(pkg));
}

export function getSponsorPackage(id: string): SponsorPackage | undefined {
  return sponsorPackages.find((pkg) => pkg.id === id);
}

function intakeSecret(): string {
  const secret =
    process.env.SPONSOR_DECK_ACCESS_SECRET?.trim() ??
    process.env.SPONSOR_INTAKE_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "development") return DEV_FALLBACK_SECRET;
  throw new Error("SPONSOR_DECK_ACCESS_SECRET is not configured");
}

function sign(data: string): string {
  return createHmac("sha256", intakeSecret()).update(data).digest("base64url");
}

export function createIntakeToken(data: SponsorIntakeData): string {
  const record: SponsorIntakeRecord = {
    ...data,
    submittedAt: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(record)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyIntakeToken(token: string): SponsorIntakeRecord | null {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  try {
    const expected = sign(encoded);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const record = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SponsorIntakeRecord;

    if (record.exp < Date.now()) return null;
    return record;
  } catch {
    return null;
  }
}

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function normalizeList(value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => allowed.includes(item));
}

export function parseSponsorIntakeBody(
  body: Record<string, unknown>,
): { data: SponsorIntakeData } | { error: string } {
  const packageId = normalizeText(body.packageId, 80);
  const pkg = getSponsorPackage(packageId);
  if (!pkg || pkg.contactOnly || pkg.price <= 0) {
    return { error: "Select a valid sponsorship package" };
  }

  const availabilityError = assertPackageAvailable(pkg);
  if (availabilityError) {
    return { error: availabilityError };
  }

  const companyName = normalizeText(body.companyName, 160);
  const contactName = normalizeText(body.contactName, 120);
  const jobTitle = normalizeText(body.jobTitle, 120);
  const email = normalizeText(body.email, 254).toLowerCase();
  const phone = normalizeText(body.phone, 40);
  const website = normalizeText(body.website, 200);
  const companyDescription = normalizeText(body.companyDescription, 1200);
  const socialMedia = normalizeText(body.socialMedia, 400);
  const industry = normalizeText(body.industry, 80);
  const preferredPayment = normalizeText(body.preferredPayment, 80);
  const meetingNotes = normalizeText(body.meetingNotes, 600);
  const categorySponsorshipCategoryId = normalizeText(
    body.categorySponsorshipCategoryId,
    120,
  );
  const categorySponsorshipCategoryTitle = normalizeText(
    body.categorySponsorshipCategoryTitle,
    160,
  );
  const logoAssetUrl = normalizeText(body.logoAssetUrl, 500);
  const logoAssetName = normalizeText(body.logoAssetName, 200);
  const videoAdAssetUrl = normalizeText(body.videoAdAssetUrl, 500);
  const videoAdAssetName = normalizeText(body.videoAdAssetName, 200);

  if (!companyName) return { error: "Company name is required" };
  if (!contactName) return { error: "Contact name is required" };
  if (!jobTitle) return { error: "Job title is required" };
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: "A valid email address is required" };
  }
  if (!phone) return { error: "Phone number is required" };
  if (!companyDescription) {
    return { error: "Brief company description is required" };
  }
  if (!industry) return { error: "Industry is required" };
  if (
    !preferredPaymentOptions.includes(
      preferredPayment as (typeof preferredPaymentOptions)[number],
    )
  ) {
    return { error: "Select a preferred payment option" };
  }

  if (
    preferredPayment === PAY_BY_CHECK_OR_MONEY_ORDER_MEETING &&
    !meetingNotes
  ) {
    return {
      error:
        "Share your preferred meeting times when scheduling a check or money order pickup",
    };
  }
  if (packageId === "category-sponsor" && !categorySponsorshipCategoryId) {
    return { error: "Select the category you want to sponsor" };
  }

  const primaryGoals: string[] = [];
  const activationSelections: string[] = [];
  const assetSelections = normalizeList(body.availableAssets, availableAssets);

  if (assetSelections.length === 0) {
    return { error: "Select at least one available asset" };
  }

  const authorized = body.authorized === true;
  const exclusivityAcknowledged = body.exclusivityAcknowledged === true;
  const availabilityAcknowledged = body.availabilityAcknowledged === true;

  if (!authorized || !exclusivityAcknowledged || !availabilityAcknowledged) {
    return { error: "All required agreements must be accepted" };
  }

  return {
    data: {
      packageId,
      categorySponsorshipCategoryId:
        packageId === "category-sponsor" ? categorySponsorshipCategoryId : "",
      categorySponsorshipCategoryTitle:
        packageId === "category-sponsor" ? categorySponsorshipCategoryTitle : "",
      companyName,
      contactName,
      jobTitle,
      email,
      phone,
      website,
      companyDescription,
      socialMedia,
      industry,
      preferredPayment,
      meetingNotes,
      primaryGoals,
      activationInterests: activationSelections,
      availableAssets: assetSelections,
      logoAssetUrl,
      logoAssetName,
      videoAdAssetUrl,
      videoAdAssetName,
      authorized,
      exclusivityAcknowledged,
      availabilityAcknowledged,
    },
  };
}
