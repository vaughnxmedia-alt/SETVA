import type { SponsorPackage } from "@/lib/site";
import { site } from "@/lib/site";

/** Sold counts per package — update in Vercel without redeploying code. */
function soldCountsFromEnv(): Record<string, number> {
  const raw = process.env.SPONSOR_SOLD_COUNTS?.trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const counts: Record<string, number> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        counts[id] = Math.floor(value);
      }
    }
    return counts;
  } catch {
    return {};
  }
}

export function getPackageSoldCount(packageId: string): number {
  return soldCountsFromEnv()[packageId] ?? 0;
}

export function getPackageRemaining(pkg: SponsorPackage): number | null {
  if (pkg.maxAvailable == null) return null;
  return Math.max(0, pkg.maxAvailable - getPackageSoldCount(pkg.id));
}

export function isPackageSoldOut(pkg: SponsorPackage): boolean {
  const remaining = getPackageRemaining(pkg);
  return remaining !== null && remaining <= 0;
}

export function packageAvailabilityLabel(pkg: SponsorPackage): string | null {
  const remaining = getPackageRemaining(pkg);
  if (remaining === null) return null;
  if (remaining <= 0) return "Sold out";
  if (remaining === 1) return "1 slot left";
  return `${remaining} slots left`;
}

export function assertPackageAvailable(pkg: SponsorPackage): string | null {
  if (isPackageSoldOut(pkg)) {
    return `${pkg.name} is sold out. Email ${site.contact.email} to join the waitlist.`;
  }
  return null;
}
