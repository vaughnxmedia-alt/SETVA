import { randomBytes } from "crypto";
import {
  createFormSubmission,
  FORM_TYPES,
  formStorageMode,
  getFormSubmissionByExternalId,
  listFormSubmissions,
  updateFormSubmission,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";
import {
  defaultAmbassadorAdminFields,
  slugifyAmbassadorStatus,
  type AmbassadorAdminFields,
  type AmbassadorRegistration,
  type AmbassadorRegistrationData,
} from "@/lib/ambassadors";
import { ticketPartnerTrackingUrl } from "@/lib/ticket-partner/links";
import { ensureAmbassadorTicketPartnerSlug } from "@/lib/ticket-partner/resolve";

function createRegistrationId(): string {
  return `amb_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function registrationFromRecord(record: FormSubmissionRecord): AmbassadorRegistration {
  const payload = record.payload as AmbassadorRegistrationData;
  const admin = {
    ...defaultAmbassadorAdminFields(),
    ...(record.admin_data as Partial<AmbassadorAdminFields>),
  };

  return {
    ...payload,
    ...admin,
    id: record.external_id ?? record.id,
    submittedAt: record.submitted_at,
    updatedAt: record.updated_at,
    lastStatusEmailAt: record.last_status_email_at,
  };
}

function registrationToPayload(registration: AmbassadorRegistration): {
  payload: Record<string, unknown>;
  adminData: Record<string, unknown>;
} {
  const adminDefaults = defaultAmbassadorAdminFields();
  const payload: Record<string, unknown> = {};
  const adminData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(registration)) {
    if (key === "id" || key === "submittedAt" || key === "updatedAt" || key === "lastStatusEmailAt") {
      continue;
    }
    if (key in adminDefaults) {
      adminData[key] = value;
    } else {
      payload[key] = value;
    }
  }

  return { payload, adminData };
}

async function withTicketPartnerFields(
  registration: AmbassadorRegistration,
): Promise<AmbassadorRegistration> {
  const activeStatuses = new Set(["Approved", "Active"]);
  if (!activeStatuses.has(registration.status)) return registration;

  const ticketPartnerSlug = await ensureAmbassadorTicketPartnerSlug({
    id: registration.id,
    fullName: registration.fullName,
    ticketPartnerSlug: registration.ticketPartnerSlug,
  });
  const ambassadorLink = ticketPartnerTrackingUrl(ticketPartnerSlug);

  if (
    ticketPartnerSlug === registration.ticketPartnerSlug &&
    ambassadorLink === registration.ambassadorLink
  ) {
    return registration;
  }

  return {
    ...registration,
    ticketPartnerSlug,
    ambassadorLink,
  };
}

export async function saveAmbassadorRegistration(
  data: AmbassadorRegistrationData,
): Promise<AmbassadorRegistration> {
  if (formStorageMode() !== "supabase") {
    throw new Error("Ambassador registration storage is not configured");
  }

  const now = new Date().toISOString();
  const id = createRegistrationId();
  const registration: AmbassadorRegistration = {
    ...data,
    ...defaultAmbassadorAdminFields(),
    id,
    submittedAt: now,
    updatedAt: now,
    lastStatusEmailAt: null,
  };

  const { payload, adminData } = registrationToPayload(registration);
  const record = await createFormSubmission({
    externalId: id,
    formType: FORM_TYPES.ambassadors,
    status: slugifyAmbassadorStatus(registration.status),
    contactEmail: registration.email,
    contactName: registration.fullName,
    payload,
    adminData,
  });

  if (!record) {
    throw new Error("Failed to save ambassador registration");
  }

  return registrationFromRecord(record);
}

export async function listAmbassadorRegistrations(): Promise<AmbassadorRegistration[]> {
  if (formStorageMode() !== "supabase") return [];
  const records = await listFormSubmissions(FORM_TYPES.ambassadors);
  return records.map(registrationFromRecord);
}

export async function getAmbassadorRegistration(
  id: string,
): Promise<AmbassadorRegistration | null> {
  if (formStorageMode() !== "supabase") return null;
  const record = await getFormSubmissionByExternalId(id, FORM_TYPES.ambassadors);
  return record ? registrationFromRecord(record) : null;
}

export async function updateAmbassadorRegistration(
  id: string,
  updates: {
    admin?: Partial<AmbassadorAdminFields>;
    lastStatusEmailAt?: string | null;
  },
): Promise<AmbassadorRegistration | null> {
  const current = await getAmbassadorRegistration(id);
  if (!current) return null;

  const next: AmbassadorRegistration = await withTicketPartnerFields({
    ...current,
    ...updates.admin,
    updatedAt: new Date().toISOString(),
    lastStatusEmailAt:
      updates.lastStatusEmailAt === undefined
        ? current.lastStatusEmailAt
        : updates.lastStatusEmailAt,
  });

  if (formStorageMode() !== "supabase") return null;

  const { adminData } = registrationToPayload(next);
  const record = await updateFormSubmission(id, FORM_TYPES.ambassadors, {
    status: slugifyAmbassadorStatus(next.status),
    adminData,
    lastStatusEmailAt: next.lastStatusEmailAt,
  });

  return record ? registrationFromRecord(record) : null;
}
