import { randomBytes } from "crypto";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
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
  defaultAdminFields,
  defaultPostEventFields,
  type MediaCredentialAdminFields,
  type MediaCredentialApplication,
  type MediaCredentialApplicationData,
  type MediaCredentialPostEvent,
} from "@/lib/media-credentials";

const DATA_DIR = path.join(process.cwd(), "data", "media-credentials", "applications");

function createApplicationId(): string {
  return `mc_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function slugifyStatus(status: string): string {
  return status.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function applicationFromRecord(record: FormSubmissionRecord): MediaCredentialApplication {
  const payload = record.payload as MediaCredentialApplicationData;
  const admin = {
    ...defaultAdminFields(),
    ...(record.admin_data as Partial<MediaCredentialAdminFields>),
  };
  const postEvent = {
    ...defaultPostEventFields(),
    ...(record.post_event_data as Partial<MediaCredentialPostEvent>),
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

function applicationToPayload(application: MediaCredentialApplication): {
  payload: Record<string, unknown>;
  adminData: Record<string, unknown>;
  postEventData: Record<string, unknown>;
} {
  const adminDefaults = defaultAdminFields();
  const postDefaults = defaultPostEventFields();
  const payload: Record<string, unknown> = {};
  const adminData: Record<string, unknown> = {};
  const postEventData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(application)) {
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

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

function applicationPath(id: string): string {
  return path.join(DATA_DIR, `${id}.json`);
}

function nextCredentialNumber(applications: MediaCredentialApplication[]): string {
  const year = new Date().getFullYear();
  const prefix = `SETVA-MC-${year}-`;
  const numbers = applications
    .map((app) => app.credentialNumber)
    .filter((value) => value.startsWith(prefix))
    .map((value) => Number.parseInt(value.slice(prefix.length), 10))
    .filter((value) => Number.isFinite(value));

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

async function saveLocalApplication(
  application: MediaCredentialApplication,
): Promise<void> {
  await ensureDataDir();
  await writeFile(
    applicationPath(application.id),
    JSON.stringify(application, null, 2),
    "utf8",
  );
}

async function listLocalApplications(): Promise<MediaCredentialApplication[]> {
  await ensureDataDir();

  let files: string[];
  try {
    files = await readdir(DATA_DIR);
  } catch {
    return [];
  }

  const applications = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const raw = await readFile(path.join(DATA_DIR, file), "utf8");
        return JSON.parse(raw) as MediaCredentialApplication;
      }),
  );

  return applications.sort(
    (a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
  );
}

async function getLocalApplication(
  id: string,
): Promise<MediaCredentialApplication | null> {
  if (!/^mc_[a-z0-9_]+$/i.test(id)) return null;

  try {
    const raw = await readFile(applicationPath(id), "utf8");
    return JSON.parse(raw) as MediaCredentialApplication;
  } catch {
    return null;
  }
}

export function mediaCredentialStorageMode(): "supabase" | "local" {
  return formStorageMode();
}

export async function saveMediaCredentialApplication(
  data: MediaCredentialApplicationData,
): Promise<MediaCredentialApplication> {
  const existing = await listMediaCredentialApplications();
  const now = new Date().toISOString();
  const adminDefaults = defaultAdminFields();
  const id = createApplicationId();

  const application: MediaCredentialApplication = {
    ...data,
    ...adminDefaults,
    ...defaultPostEventFields(),
    id,
    submittedAt: now,
    updatedAt: now,
    lastStatusEmailAt: null,
  };

  if (formStorageMode() === "supabase") {
    const { payload, adminData, postEventData } = applicationToPayload(application);
    const record = await createFormSubmission({
      externalId: id,
      formType: FORM_TYPES.mediaCredentials,
      status: slugifyStatus(application.status),
      contactEmail: application.email,
      contactName: application.fullName,
      payload,
      adminData,
      postEventData,
    });
    if (!record) {
      throw new Error("Failed to save media credential application");
    }
    return applicationFromRecord(record);
  }

  await saveLocalApplication(application);
  return application;
}

export async function listMediaCredentialApplications(): Promise<
  MediaCredentialApplication[]
> {
  if (formStorageMode() === "supabase") {
    const records = await listFormSubmissions(FORM_TYPES.mediaCredentials);
    return records.map(applicationFromRecord);
  }

  return listLocalApplications();
}

export async function getMediaCredentialApplication(
  id: string,
): Promise<MediaCredentialApplication | null> {
  if (formStorageMode() === "supabase") {
    const record = await getFormSubmissionByExternalId(
      id,
      FORM_TYPES.mediaCredentials,
    );
    return record ? applicationFromRecord(record) : null;
  }

  return getLocalApplication(id);
}

export async function updateMediaCredentialApplication(
  id: string,
  updates: {
    admin?: Partial<MediaCredentialAdminFields>;
    postEvent?: Partial<MediaCredentialPostEvent>;
    lastStatusEmailAt?: string | null;
  },
): Promise<MediaCredentialApplication | null> {
  const current = await getMediaCredentialApplication(id);
  if (!current) return null;

  const next: MediaCredentialApplication = {
    ...current,
    ...updates.admin,
    ...updates.postEvent,
    updatedAt: new Date().toISOString(),
    lastStatusEmailAt:
      updates.lastStatusEmailAt === undefined
        ? current.lastStatusEmailAt
        : updates.lastStatusEmailAt,
  };

  if (
    (next.status === "Approved" || next.status === "Approved with Restrictions") &&
    !next.credentialNumber
  ) {
    const existing = await listMediaCredentialApplications();
    next.credentialNumber = nextCredentialNumber(
      existing.filter((app) => app.id !== id),
    );
  }

  if (formStorageMode() === "supabase") {
    const { adminData, postEventData } = applicationToPayload(next);
    const record = await updateFormSubmission(id, FORM_TYPES.mediaCredentials, {
      status: slugifyStatus(next.status),
      adminData,
      postEventData,
      lastStatusEmailAt: next.lastStatusEmailAt,
    });
    return record ? applicationFromRecord(record) : null;
  }

  await saveLocalApplication(next);
  return next;
}
