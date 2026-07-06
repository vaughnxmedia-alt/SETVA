import { randomBytes } from "crypto";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  createFormSubmission,
  FORM_TYPES,
  formStorageMode,
  getFormSubmissionByExternalId,
  listFormSubmissions,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";
import type { MediaCredentialTeamMemberRecord } from "@/lib/media-credential-team";

const DATA_DIR = path.join(process.cwd(), "data", "media-credentials", "team-members");

function createTeamMemberId(): string {
  return `mct_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function externalId(applicationId: string, email: string): string {
  return `mc_team_${applicationId}_${email.toLowerCase()}`;
}

function recordFromSubmission(record: FormSubmissionRecord): MediaCredentialTeamMemberRecord {
  const payload = record.payload as MediaCredentialTeamMemberRecord;
  return {
    id: record.external_id ?? record.id,
    applicationId: String(payload.applicationId ?? ""),
    fullName: String(payload.fullName ?? record.contact_name ?? ""),
    email: String(payload.email ?? record.contact_email ?? ""),
    phone: String(payload.phone ?? ""),
    addressLine1: String(payload.addressLine1 ?? ""),
    addressLine2: String(payload.addressLine2 ?? ""),
    city: String(payload.city ?? ""),
    state: String(payload.state ?? ""),
    zip: String(payload.zip ?? ""),
    mediaOutlet: String(payload.mediaOutlet ?? ""),
    submittedAt: record.submitted_at,
  };
}

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

async function saveLocalRecord(record: MediaCredentialTeamMemberRecord): Promise<void> {
  await ensureDataDir();
  await writeFile(
    path.join(DATA_DIR, `${record.id}.json`),
    JSON.stringify(record, null, 2),
    "utf8",
  );
}

async function listLocalRecords(): Promise<MediaCredentialTeamMemberRecord[]> {
  await ensureDataDir();
  let files: string[];
  try {
    files = await readdir(DATA_DIR);
  } catch {
    return [];
  }

  const records = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const raw = await readFile(path.join(DATA_DIR, file), "utf8");
        return JSON.parse(raw) as MediaCredentialTeamMemberRecord;
      }),
  );

  return records.sort(
    (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
  );
}

export async function listMediaCredentialTeamMembers(): Promise<MediaCredentialTeamMemberRecord[]> {
  if (formStorageMode() === "supabase") {
    const records = await listFormSubmissions(FORM_TYPES.mediaCredentialTeamMembers);
    return records.map(recordFromSubmission);
  }
  return listLocalRecords();
}

export async function listMediaCredentialTeamMembersForApplication(
  applicationId: string,
): Promise<MediaCredentialTeamMemberRecord[]> {
  return (await listMediaCredentialTeamMembers()).filter(
    (record) => record.applicationId === applicationId,
  );
}

export async function saveMediaCredentialTeamMember(input: {
  data: Omit<MediaCredentialTeamMemberRecord, "id" | "submittedAt">;
}): Promise<MediaCredentialTeamMemberRecord> {
  const id = createTeamMemberId();
  const now = new Date().toISOString();
  const record: MediaCredentialTeamMemberRecord = {
    ...input.data,
    id,
    submittedAt: now,
  };

  if (formStorageMode() === "supabase") {
    const existing = await getFormSubmissionByExternalId(
      externalId(record.applicationId, record.email),
      FORM_TYPES.mediaCredentialTeamMembers,
    );
    if (existing) {
      throw new Error("A registration already exists for this email on this application.");
    }

    const saved = await createFormSubmission({
      externalId: externalId(record.applicationId, record.email),
      formType: FORM_TYPES.mediaCredentialTeamMembers,
      status: "submitted",
      contactEmail: record.email,
      contactName: record.fullName,
      payload: record,
    });
    if (!saved) {
      throw new Error("Failed to save media team member registration");
    }
    return recordFromSubmission(saved);
  }

  const localExisting = (await listLocalRecords()).find(
    (item) =>
      item.applicationId === record.applicationId &&
      item.email.toLowerCase() === record.email.toLowerCase(),
  );
  if (localExisting) {
    throw new Error("A registration already exists for this email on this application.");
  }

  await saveLocalRecord(record);
  return record;
}
