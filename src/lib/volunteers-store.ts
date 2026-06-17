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
  defaultVolunteerAdminFields,
  defaultVolunteerPostEventFields,
  slugifyVolunteerStatus,
  type VolunteerAdminFields,
  type VolunteerPostEventFields,
  type VolunteerRegistration,
  type VolunteerRegistrationData,
} from "@/lib/volunteers";

function createRegistrationId(): string {
  return `vol_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function registrationFromRecord(record: FormSubmissionRecord): VolunteerRegistration {
  const payload = record.payload as VolunteerRegistrationData;
  const admin = {
    ...defaultVolunteerAdminFields(),
    ...(record.admin_data as Partial<VolunteerAdminFields>),
  };
  const postEvent = {
    ...defaultVolunteerPostEventFields(),
    ...(record.post_event_data as Partial<VolunteerPostEventFields>),
  };

  return {
    ...payload,
    ...admin,
    ...postEvent,
    id: record.external_id ?? record.id,
    submittedAt: record.submitted_at,
    updatedAt: record.updated_at,
    lastStatusEmailAt: record.last_status_email_at,
  };
}

function registrationToPayload(registration: VolunteerRegistration): {
  payload: Record<string, unknown>;
  adminData: Record<string, unknown>;
  postEventData: Record<string, unknown>;
} {
  const adminDefaults = defaultVolunteerAdminFields();
  const postDefaults = defaultVolunteerPostEventFields();
  const payload: Record<string, unknown> = {};
  const adminData: Record<string, unknown> = {};
  const postEventData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(registration)) {
    if (key === "id" || key === "submittedAt" || key === "updatedAt" || key === "lastStatusEmailAt") {
      continue;
    }
    if (key in adminDefaults) {
      adminData[key] = value;
    } else if (key in postDefaults) {
      postEventData[key] = value;
    } else {
      payload[key] = value;
    }
  }

  return { payload, adminData, postEventData };
}

export async function saveVolunteerRegistration(
  data: VolunteerRegistrationData,
): Promise<VolunteerRegistration> {
  if (formStorageMode() !== "supabase") {
    throw new Error("Volunteer registration storage is not configured");
  }

  const now = new Date().toISOString();
  const id = createRegistrationId();
  const adminDefaults = defaultVolunteerAdminFields();

  const registration: VolunteerRegistration = {
    ...data,
    ...adminDefaults,
    ...defaultVolunteerPostEventFields(),
    id,
    submittedAt: now,
    updatedAt: now,
    lastStatusEmailAt: null,
  };

  const { payload, adminData, postEventData } = registrationToPayload(registration);
  const record = await createFormSubmission({
    externalId: id,
    formType: FORM_TYPES.volunteers,
    status: slugifyVolunteerStatus(registration.status),
    contactEmail: registration.email,
    contactName: registration.fullName,
    payload,
    adminData,
    postEventData,
  });

  if (!record) {
    throw new Error("Failed to save volunteer registration");
  }

  return registrationFromRecord(record);
}

export async function listVolunteerRegistrations(): Promise<VolunteerRegistration[]> {
  if (formStorageMode() !== "supabase") return [];
  const records = await listFormSubmissions(FORM_TYPES.volunteers);
  return records.map(registrationFromRecord);
}

export async function getVolunteerRegistration(
  id: string,
): Promise<VolunteerRegistration | null> {
  if (formStorageMode() !== "supabase") return null;
  const record = await getFormSubmissionByExternalId(id, FORM_TYPES.volunteers);
  return record ? registrationFromRecord(record) : null;
}

export async function updateVolunteerRegistration(
  id: string,
  updates: {
    admin?: Partial<VolunteerAdminFields>;
    postEvent?: Partial<VolunteerPostEventFields>;
    lastStatusEmailAt?: string | null;
  },
): Promise<VolunteerRegistration | null> {
  const current = await getVolunteerRegistration(id);
  if (!current) return null;

  const next: VolunteerRegistration = {
    ...current,
    ...updates.admin,
    ...updates.postEvent,
    updatedAt: new Date().toISOString(),
    lastStatusEmailAt:
      updates.lastStatusEmailAt === undefined
        ? current.lastStatusEmailAt
        : updates.lastStatusEmailAt,
  };

  if (formStorageMode() !== "supabase") return null;

  const { adminData, postEventData } = registrationToPayload(next);
  const record = await updateFormSubmission(id, FORM_TYPES.volunteers, {
    status: slugifyVolunteerStatus(next.status),
    adminData,
    postEventData,
    lastStatusEmailAt: next.lastStatusEmailAt,
  });

  return record ? registrationFromRecord(record) : null;
}
