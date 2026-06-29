import { site, ticketPartnerInfo } from "@/lib/site";

export const ambassadorPromotionChannels = [
  "Social media",
  "Church",
  "Business network",
  "Family & friends",
  "Community groups",
  "Other",
] as const;

export const ambassadorStatusOptions = [
  "Pending Review",
  "Approved",
  "Active",
  "Paused",
  "Denied",
] as const;

export type AmbassadorPromotionChannel = (typeof ambassadorPromotionChannels)[number];
export type AmbassadorStatus = (typeof ambassadorStatusOptions)[number];

export type AmbassadorRegistrationData = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  organization: string;
  promotionChannels: AmbassadorPromotionChannel[];
  socialHandle: string;
  estimatedReach: string;
  whyJoin: string;
  agreementAccepted: boolean;
};

export type AmbassadorAdminFields = {
  status: AmbassadorStatus;
  ambassadorLink: string;
  ticketPartnerSlug: string;
  internalNotes: string;
  reviewedByName: string;
  reviewedByEmail: string;
  reviewedAt: string;
};

export type AmbassadorRegistration = AmbassadorRegistrationData &
  AmbassadorAdminFields & {
    id: string;
    submittedAt: string;
    updatedAt: string;
    lastStatusEmailAt: string | null;
  };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function ambassadorRegistrationOpensAt(): Date {
  return new Date(ticketPartnerInfo.registrationOpensAt);
}

export function isAmbassadorRegistrationOpen(now = new Date()): boolean {
  return now.getTime() >= ambassadorRegistrationOpensAt().getTime();
}

export function ambassadorRegistrationClosedMessage(): string {
  return `Ambassador registration opens ${ticketPartnerInfo.registrationOpensLabel}.`;
}

export function ambassadorSuccessMessage(): string {
  return `Thank you for registering as a SETVA ambassador. Our team will review your application and follow up with your custom ticket link and next steps.`;
}

export const ambassadorAgreementText = `I understand the SETVA Ticket Partner (Ambassador) program pays ${ticketPartnerInfo.commissionPercent}% commission on qualifying ticket sales through my assigned link, that payouts occur after the event per program terms, and that SETVA may approve or decline ambassador applications at its discretion.`;

export function slugifyAmbassadorStatus(status: string): string {
  return status.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function defaultAmbassadorAdminFields(): AmbassadorAdminFields {
  return {
    status: "Pending Review",
    ambassadorLink: "",
    ticketPartnerSlug: "",
    internalNotes: "",
    reviewedByName: "",
    reviewedByEmail: "",
    reviewedAt: "",
  };
}

export function parseAmbassadorBody(
  body: Record<string, unknown>,
): { data: AmbassadorRegistrationData } | { error: string } {
  if (!isAmbassadorRegistrationOpen()) {
    return { error: ambassadorRegistrationClosedMessage() };
  }

  const fullName = normalizeText(body.fullName, 120);
  const email = normalizeText(body.email, 254).toLowerCase();
  const phone = normalizeText(body.phone, 40);
  const city = normalizeText(body.city, 120);
  const organization = normalizeText(body.organization, 160);
  const promotionChannels = normalizeList(
    body.promotionChannels,
    ambassadorPromotionChannels,
  ) as AmbassadorPromotionChannel[];
  const socialHandle = normalizeText(body.socialHandle, 200);
  const estimatedReach = normalizeText(body.estimatedReach, 80);
  const whyJoin = normalizeText(body.whyJoin, 2000);
  const agreementAccepted = body.agreementAccepted === true;

  if (!fullName) return { error: "Full name is required" };
  if (!phone) return { error: "Phone number is required" };
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: "A valid email address is required" };
  }
  if (!city) return { error: "City is required" };
  if (promotionChannels.length === 0) {
    return { error: "Select at least one way you plan to promote tickets" };
  }
  if (!agreementAccepted) {
    return { error: "You must accept the ambassador agreement" };
  }

  return {
    data: {
      fullName,
      email,
      phone,
      city,
      organization,
      promotionChannels,
      socialHandle,
      estimatedReach,
      whyJoin,
      agreementAccepted,
    },
  };
}
