import { createMediaCredentialAccessToken } from "@/lib/media-credential-access";
import { getPublicSiteUrl } from "@/lib/site-url";

export type MediaTeamMemberRosterEntry = {
  name: string;
};

export type MediaCredentialTeamMemberData = {
  applicationId: string;
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
};

export type MediaCredentialTeamMemberRecord = MediaCredentialTeamMemberData & {
  id: string;
  mediaOutlet: string;
  submittedAt: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function parseMediaTeamMemberRoster(value: unknown): MediaTeamMemberRosterEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const name = normalizeText((entry as { name?: unknown }).name, 120);
      if (!name) return null;
      return { name };
    })
    .filter((entry): entry is MediaTeamMemberRosterEntry => Boolean(entry));
}

export function mediaCredentialTeamMemberFormUrl(
  applicationId: string,
  applicantEmail: string,
): string {
  const base = getPublicSiteUrl().replace(/\/$/, "");
  const token = createMediaCredentialAccessToken({
    applicationId,
    email: applicantEmail,
  });
  const params = new URLSearchParams({
    application: applicationId,
    access: token,
  });
  return `${base}/media-credentials/team?${params.toString()}`;
}

export function parseMediaCredentialTeamMemberBody(
  body: Record<string, unknown>,
  applicationId: string,
): { data: MediaCredentialTeamMemberData } | { error: string } {
  const fullName = normalizeText(body.fullName, 120);
  const email = normalizeText(body.email, 254).toLowerCase();
  const phone = normalizeText(body.phone, 40);
  const addressLine1 = normalizeText(body.addressLine1, 160);
  const addressLine2 = normalizeText(body.addressLine2, 160);
  const city = normalizeText(body.city, 80);
  const state = normalizeText(body.state, 40);
  const zip = normalizeText(body.zip, 20);

  if (!fullName) return { error: "Full name is required" };
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: "A valid email address is required" };
  }
  if (!phone) return { error: "Phone number is required" };
  if (!addressLine1) return { error: "Street address is required" };
  if (!city) return { error: "City is required" };
  if (!state) return { error: "State is required" };
  if (!zip) return { error: "ZIP code is required" };

  return {
    data: {
      applicationId,
      fullName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zip,
    },
  };
}

export function formatMediaTeamMemberAddress(
  member: Pick<
    MediaCredentialTeamMemberData,
    "addressLine1" | "addressLine2" | "city" | "state" | "zip"
  >,
): string {
  const lines = [
    member.addressLine1,
    member.addressLine2,
    `${member.city}, ${member.state} ${member.zip}`.trim(),
  ].filter(Boolean);
  return lines.join("\n");
}

export const mediaCredentialTeamMemberWarning =
  "Important: Any team member who does not complete the registration form will not be permitted entry on event day.";

export const mediaCredentialTeamMemberSuccessMessage =
  "Your team member registration has been submitted. Please bring a photo ID and this confirmation email to media check-in.";
