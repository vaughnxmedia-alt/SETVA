import { site } from "@/lib/site";
import type { SponsorPackage } from "@/lib/site";

const BASE_COMPANY_INFO = [
  "Legal company name (as it should appear on stage, print, and digital)",
  "Primary contact for approvals (name, email, phone)",
  "Company website URL",
  "Social media handles (Instagram, Facebook, LinkedIn, etc.)",
];

const BASE_BRAND_ASSETS = [
  "High-resolution logo (PNG or SVG, 300 DPI minimum, transparent background preferred)",
  "Brand colors (hex codes or Pantone)",
  "Brand guidelines PDF (if available)",
  "Short company description for program copy and web (50–100 words)",
];

const PACKAGE_EXTRA_REQUIREMENTS: Record<string, string[]> = {
  "title-sponsor": [
    'Approved "Presented by [Company Name]" wording',
    "Opening ceremony speaker name and title (if using speaking slot)",
    "Press release quote and approved spokesperson headshot",
    "VIP guest list contact (up to 10 names for premium access)",
    "Vendor space setup requirements",
  ],
  "legacy-sponsor": [
    "VIP guest list contact (up to 6 names)",
    "Vendor space setup requirements",
    "Magazine feature copy and approved imagery",
  ],
  "gold-visionary": [
    "VIP guest list contact (up to 4 names)",
    "Vendor space setup requirements",
    "Half-page magazine copy and approved imagery",
  ],
  "silver-impact": [
    "VIP guest list contact (up to 2 names)",
    "Quarter-page magazine copy and approved imagery",
  ],
  "bronze-community": [
    "Logo placement preference (if applicable)",
  ],
  "red-carpet": [
    "Step-and-repeat logo lockup",
    "Red carpet interview talking points (optional)",
    "VIP guest list contact",
  ],
  "fashion-show": [
    "Fashion show segment branding assets",
    "On-screen logo lockup for live program",
  ],
  "live-stream": [
    "15-second sponsor commercial video (broadcast-safe, if using commercial spot)",
    "Lower-third logo and end-card assets",
    "Livestream mention talking points",
  ],
  "media-sponsor": [
    "Media partner logo lockups for broadcast graphics",
    "On-air mention script approval contact",
  ],
  "visionaries-magazine": [
    "Full-page or half-page magazine ad artwork (print-ready PDF)",
    "Approved copy and photography",
  ],
  "vip-lounge": [
    "Lounge signage artwork",
    "VIP guest list contact",
    "Product sampling or activation details (if applicable)",
  ],
  "trophy": [
    "Trophy presentation moment branding assets",
    "On-stage acknowledgment script approval",
  ],
  "visionary-award": [
    "Category moment branding assets",
    "Presenter introduction talking points (if applicable)",
  ],
  "community-impact": [
    "Community impact story or quote for stage recognition",
  ],
  "youth-excellence": [
    "Youth program alignment statement for stage recognition",
  ],
  "category-sponsor": [
    "Category name confirmation and logo for category slide",
  ],
};

export function getPackageAssetsNeeded(pkg: SponsorPackage): string[] {
  const extras = PACKAGE_EXTRA_REQUIREMENTS[pkg.id] ?? [];
  const vipBenefit = pkg.benefits.find((benefit) => /VIP ticket/i.test(benefit));
  const derived: string[] = [];

  if (/commercial|video|reel/i.test(pkg.benefits.join(" ")) && !extras.some((e) => /video/i.test(e))) {
    derived.push("Broadcast-safe video or reel assets (if applicable to your package)");
  }
  if (/magazine/i.test(pkg.benefits.join(" ")) && !extras.some((e) => /magazine/i.test(e))) {
    derived.push("Magazine-ready photography and ad copy");
  }
  if (vipBenefit && !extras.some((e) => /VIP guest/i.test(e))) {
    derived.push(`VIP ticket names (${vipBenefit.match(/\d+/)?.[0] ?? "see package"} guests)`);
  }

  return [...BASE_COMPANY_INFO, ...BASE_BRAND_ASSETS, ...extras, ...derived];
}

export function buildSponsorFulfillmentEmail(
  pkg: SponsorPackage,
  contactName = "[Contact Name]",
  companyName = "[Company Name]",
): { subject: string; body: string } {
  const assets = getPackageAssetsNeeded(pkg);
  const subject = `SETVA 2026 — Next steps for your ${pkg.name} sponsorship`;

  const body = [
    `Hi ${contactName},`,
    "",
    `Thank you for partnering with ${site.fullName} as a ${pkg.name} sponsor. We're excited to activate your benefits for ${site.event.dateLabel} at ${site.event.venue}.`,
    "",
    `To finalize your placement across stage, press, digital, and on-site materials, please send the following for ${companyName}:`,
    "",
    ...assets.map((item) => `• ${item}`),
    "",
    "Please reply to this email with files attached or share a download link (Google Drive, Dropbox, etc.).",
    "",
    `Payment reminder: all sponsorship payments must be received in full by ${site.event.sponsorshipPaymentDue}.`,
    "",
    "If you have questions, reply here or contact us at " + site.contact.email + ".",
    "",
    "Thank you,",
    site.fullName + " Sponsorship Team",
  ].join("\n");

  return { subject, body };
}
