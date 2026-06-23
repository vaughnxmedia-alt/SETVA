import {
  createFormSubmission,
  FORM_TYPES,
  formStorageMode,
  getFormSubmissionByExternalId,
  listFormSubmissions,
  updateFormSubmission,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";

export type HQTeamMemberStatus = "active" | "revoked";

export type HQTeamMember = {
  setvaId: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  status: HQTeamMemberStatus;
  sessionVersion: number;
  createdAt: string;
  updatedAt: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function memberExternalId(email: string): string {
  return `hq_member_${normalizeEmail(email)}`;
}

function fromRecord(record: FormSubmissionRecord): HQTeamMember {
  const payload = record.payload as Partial<HQTeamMember>;
  return {
    setvaId: String(payload.setvaId ?? ""),
    name: String(payload.name ?? record.contact_name ?? ""),
    email: String(payload.email ?? record.contact_email ?? ""),
    phone: String(payload.phone ?? ""),
    passwordHash: String(payload.passwordHash ?? ""),
    status: payload.status === "revoked" ? "revoked" : "active",
    sessionVersion: Number(payload.sessionVersion ?? 1),
    createdAt: String(payload.createdAt ?? record.submitted_at),
    updatedAt: record.updated_at,
  };
}

function toPayload(member: HQTeamMember): Record<string, unknown> {
  return { ...member };
}

export async function listHQTeamMembers(): Promise<HQTeamMember[]> {
  if (formStorageMode() !== "supabase") return [];
  const records = await listFormSubmissions(FORM_TYPES.hqTeamMembers);
  return records
    .map(fromRecord)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getHQTeamMemberByEmail(email: string): Promise<HQTeamMember | null> {
  if (formStorageMode() !== "supabase") return null;
  const record = await getFormSubmissionByExternalId(
    memberExternalId(email),
    FORM_TYPES.hqTeamMembers,
  );
  return record ? fromRecord(record) : null;
}

async function saveMember(member: HQTeamMember, status: string): Promise<HQTeamMember> {
  if (formStorageMode() !== "supabase") {
    throw new Error("HQ team storage is not configured");
  }

  const externalId = memberExternalId(member.email);
  const existing = await getFormSubmissionByExternalId(externalId, FORM_TYPES.hqTeamMembers);
  const record = existing
    ? await updateFormSubmission(externalId, FORM_TYPES.hqTeamMembers, {
        status,
        contactEmail: member.email,
        contactName: member.name,
        payload: toPayload(member),
      })
    : await createFormSubmission({
        externalId,
        formType: FORM_TYPES.hqTeamMembers,
        status,
        contactEmail: member.email,
        contactName: member.name,
        payload: toPayload(member),
      });

  if (!record) throw new Error("Failed to save HQ team member");
  return fromRecord(record);
}

export async function nextSetvaId(): Promise<string> {
  const members = await listHQTeamMembers();
  const max = members.reduce((current, member) => {
    const match = member.setvaId.match(/^SETVA-(\d+)$/i);
    if (!match) return current;
    return Math.max(current, Number(match[1]));
  }, 0);

  return `SETVA-${String(max + 1).padStart(4, "0")}`;
}

export async function registerHQTeamMember(input: {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
}): Promise<HQTeamMember> {
  const email = input.email.trim();
  const existing = await getHQTeamMemberByEmail(email);
  if (existing?.status === "active") {
    throw new Error("An account already exists for this email.");
  }

  const now = new Date().toISOString();
  const setvaId = existing?.setvaId || (await nextSetvaId());

  return saveMember(
    {
      setvaId,
      name: input.name.trim(),
      email,
      phone: input.phone?.trim() ?? existing?.phone ?? "",
      passwordHash: input.passwordHash,
      status: "active",
      sessionVersion: (existing?.sessionVersion ?? 0) + 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    },
    "active",
  );
}

export async function updateHQTeamMemberAccess(input: {
  email: string;
  status: HQTeamMemberStatus;
}): Promise<HQTeamMember> {
  const member = await getHQTeamMemberByEmail(input.email);
  if (!member) throw new Error("User not found.");

  const now = new Date().toISOString();
  return saveMember(
    {
      ...member,
      status: input.status,
      sessionVersion: member.sessionVersion + 1,
      updatedAt: now,
    },
    input.status,
  );
}
