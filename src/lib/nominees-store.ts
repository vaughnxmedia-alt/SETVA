import { randomBytes } from "crypto";
import {
  createFormSubmission,
  deleteFormSubmission,
  FORM_TYPES,
  formStorageMode,
  getFormSubmissionByExternalId,
  listFormSubmissions,
  updateFormSubmission,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";
import {
  defaultNomineeAdminFields,
  type NomineeAdminFields,
  type NomineeData,
  type NomineeRecordFull,
} from "@/lib/nominees";

function createNomineeId(): string {
  return `nom_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function nomineeFromRecord(record: FormSubmissionRecord): NomineeRecordFull {
  const payload = record.payload as NomineeData;
  const admin = {
    ...defaultNomineeAdminFields(),
    ...(record.admin_data as Partial<NomineeAdminFields>),
  };

  return {
    ...payload,
    ...admin,
    id: record.external_id ?? record.id,
    submittedAt: record.submitted_at,
    updatedAt: record.updated_at,
  };
}

function nomineeToStorage(record: NomineeRecordFull): {
  payload: Record<string, unknown>;
  adminData: Record<string, unknown>;
} {
  const adminDefaults = defaultNomineeAdminFields();
  const payload: Record<string, unknown> = {};
  const adminData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (key === "id" || key === "submittedAt" || key === "updatedAt") continue;
    if (key in adminDefaults) {
      adminData[key] = value;
    } else {
      payload[key] = value;
    }
  }

  return { payload, adminData };
}

export async function listNominees(): Promise<NomineeRecordFull[]> {
  if (formStorageMode() !== "supabase") return [];
  const records = await listFormSubmissions(FORM_TYPES.nominees);
  return records.map(nomineeFromRecord);
}

export async function getNominee(id: string): Promise<NomineeRecordFull | null> {
  if (formStorageMode() !== "supabase") return null;
  const record = await getFormSubmissionByExternalId(id, FORM_TYPES.nominees);
  return record ? nomineeFromRecord(record) : null;
}

export async function upsertNominee(
  data: NomineeData,
  id: string,
  addedBy?: { name: string; email: string },
): Promise<NomineeRecordFull> {
  if (formStorageMode() !== "supabase") {
    throw new Error("Nominee storage is not configured");
  }

  const existing = await getNominee(id);
  const now = new Date().toISOString();
  const nominee: NomineeRecordFull = {
    ...data,
    ...defaultNomineeAdminFields(addedBy),
    ...(existing
      ? {
          addedByName: existing.addedByName,
          addedByEmail: existing.addedByEmail,
        }
      : {}),
    id,
    submittedAt: existing?.submittedAt ?? now,
    updatedAt: now,
  };

  const { payload, adminData } = nomineeToStorage(nominee);
  const record = existing
    ? await updateFormSubmission(id, FORM_TYPES.nominees, {
        status: "directory_record",
        contactEmail: nominee.contactEmail || undefined,
        contactName: nominee.name,
        payload,
        adminData,
      })
    : await createFormSubmission({
        externalId: id,
        formType: FORM_TYPES.nominees,
        status: "directory_record",
        contactEmail: nominee.contactEmail || undefined,
        contactName: nominee.name,
        payload,
        adminData,
      });

  if (!record) {
    throw new Error("Failed to save nominee");
  }

  return nomineeFromRecord(record);
}

export async function saveNominee(
  data: NomineeData,
  addedBy?: { name: string; email: string },
): Promise<NomineeRecordFull> {
  if (formStorageMode() !== "supabase") {
    throw new Error("Nominee storage is not configured");
  }

  const now = new Date().toISOString();
  const id = createNomineeId();
  const nominee: NomineeRecordFull = {
    ...data,
    ...defaultNomineeAdminFields(addedBy),
    id,
    submittedAt: now,
    updatedAt: now,
  };

  const { payload, adminData } = nomineeToStorage(nominee);
  const record = await createFormSubmission({
    externalId: id,
    formType: FORM_TYPES.nominees,
    status: "directory_record",
    contactEmail: nominee.contactEmail || undefined,
    contactName: nominee.name,
    payload,
    adminData,
  });

  if (!record) {
    throw new Error("Failed to save nominee");
  }

  return nomineeFromRecord(record);
}

export async function saveNomineesBulk(
  rows: NomineeData[],
  addedBy?: { name: string; email: string },
): Promise<{ saved: NomineeRecordFull[]; failed: { row: NomineeData; error: string }[] }> {
  const saved: NomineeRecordFull[] = [];
  const failed: { row: NomineeData; error: string }[] = [];

  for (const row of rows) {
    try {
      saved.push(await saveNominee(row, addedBy));
    } catch (error) {
      failed.push({
        row,
        error: error instanceof Error ? error.message : "Save failed",
      });
    }
  }

  return { saved, failed };
}

export async function updateNominee(
  id: string,
  updates: {
    data?: Partial<NomineeData>;
    admin?: Partial<NomineeAdminFields>;
  },
): Promise<NomineeRecordFull | null> {
  const current = await getNominee(id);
  if (!current) return null;
  if (formStorageMode() !== "supabase") return null;

  const next: NomineeRecordFull = {
    ...current,
    ...updates.data,
    ...updates.admin,
    updatedAt: new Date().toISOString(),
  };

  const { payload, adminData } = nomineeToStorage(next);
  const record = await updateFormSubmission(id, FORM_TYPES.nominees, {
    status: "directory_record",
    contactEmail: next.contactEmail || undefined,
    contactName: next.name,
    payload,
    adminData,
  });

  return record ? nomineeFromRecord(record) : null;
}

export async function deleteNominee(id: string): Promise<boolean> {
  if (formStorageMode() !== "supabase") return false;
  return deleteFormSubmission(id, FORM_TYPES.nominees);
}
