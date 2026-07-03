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
import type { Honoree } from "@/lib/honorees";

function createHonoreeId(): string {
  return `honoree_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function honoreeFromRecord(record: FormSubmissionRecord): Honoree {
  const payload = record.payload as Omit<Honoree, "id" | "submittedAt" | "updatedAt">;
  return {
    ...payload,
    id: record.external_id ?? record.id,
    submittedAt: record.submitted_at,
    updatedAt: record.updated_at,
  };
}

export async function listHonorees(): Promise<Honoree[]> {
  if (formStorageMode() !== "supabase") return [];
  const records = await listFormSubmissions(FORM_TYPES.honorees);
  return records
    .map(honoreeFromRecord)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getHonoree(id: string): Promise<Honoree | null> {
  if (formStorageMode() !== "supabase") return null;
  const record = await getFormSubmissionByExternalId(id, FORM_TYPES.honorees);
  return record ? honoreeFromRecord(record) : null;
}

export async function saveHonoree(
  input: Omit<Honoree, "id" | "submittedAt" | "updatedAt">,
  id?: string,
): Promise<Honoree> {
  if (formStorageMode() !== "supabase") {
    throw new Error("Honoree storage is not configured");
  }

  const externalId = id || createHonoreeId();
  const payload = input as unknown as Record<string, unknown>;
  const existing = await getFormSubmissionByExternalId(externalId, FORM_TYPES.honorees);
  const record = existing
    ? await updateFormSubmission(externalId, FORM_TYPES.honorees, {
        status: input.status.toLowerCase(),
        contactName: input.name,
        payload,
      })
    : await createFormSubmission({
        externalId,
        formType: FORM_TYPES.honorees,
        status: input.status.toLowerCase(),
        contactName: input.name,
        payload,
      });

  if (!record) throw new Error("Failed to save honoree");
  return honoreeFromRecord(record);
}

export async function deleteHonoree(id: string): Promise<boolean> {
  if (formStorageMode() !== "supabase") return false;
  return deleteFormSubmission(id, FORM_TYPES.honorees);
}

export async function listPublishedHonorees(): Promise<Honoree[]> {
  const honorees = await listHonorees();
  return honorees
    .filter((honoree) => honoree.publishToMagazine && honoree.status === "Published")
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
