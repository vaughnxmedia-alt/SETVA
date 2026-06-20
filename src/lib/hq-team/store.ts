import {
  createFormSubmission,
  FORM_TYPES,
  formStorageMode,
  getFormSubmissionByExternalId,
  listFormSubmissions,
  updateFormSubmission,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";

export type HQTeamMemberStatus = "pending_request" | "approved" | "active" | "revoked";

export type HQTeamMember = {
  setvaId: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  status: HQTeamMemberStatus;
  sessionVersion: number;
  requestedAt: string;
  approvedAt: string;
  activatedAt: string;
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
    status: (payload.status as HQTeamMemberStatus) ?? "pending_request",
    sessionVersion: Number(payload.sessionVersion ?? 1),
    requestedAt: String(payload.requestedAt ?? record.submitted_at),
    approvedAt: String(payload.approvedAt ?? ""),
    activatedAt: String(payload.activatedAt ?? ""),
    updatedAt: record.updated_at,
  };
}

function toPayload(member: HQTeamMember): Record<string, unknown> {
  return { ...member };
}

export async function listHQTeamMembers(): Promise<HQTeamMember[]> {
  if (formStorageMode() !== "supabase") return [];
  const records = await listFormSubmissions(FORM_TYPES.hqTeamMembers);
  return records.map(fromRecord);
}

export async function getHQTeamMemberByEmail(email: string): Promise<HQTeamMember | null> {
  if (formStorageMode() !== "supabase") return null;
  const record = await getFormSubmissionByExternalId(
    memberExternalId(email),
    FORM_TYPES.hqTeamMembers,
  );
  return record ? fromRecord(record) : null;
}

export async function getHQTeamMemberBySetvaId(setvaId: string): Promise<HQTeamMember | null> {
  const members = await listHQTeamMembers();
  return members.find((member) => member.setvaId === setvaId.trim().toUpperCase()) ?? null;
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

export async function createHQTeamAccessRequest(input: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<HQTeamMember> {
  const email = input.email.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const name = `${firstName} ${lastName}`.trim();
  const existing = await getHQTeamMemberByEmail(email);
  if (existing?.status === "active") {
    throw new Error("An active account already exists for this email.");
  }
  if (existing?.status === "pending_request") {
    throw new Error("An access request is already pending for this email.");
  }
  if (existing?.status === "approved") {
    throw new Error("This email is approved. Check your inbox for your SETVA ID to finish setup.");
  }

  const now = new Date().toISOString();
  return saveMember(
    {
      setvaId: existing?.setvaId ?? "",
      name,
      email,
      phone: existing?.phone ?? "",
      passwordHash: existing?.passwordHash ?? "",
      status: "pending_request",
      sessionVersion: existing?.sessionVersion ?? 1,
      requestedAt: now,
      approvedAt: existing?.approvedAt ?? "",
      activatedAt: existing?.activatedAt ?? "",
      updatedAt: now,
    },
    "pending_request",
  );
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

export async function approveHQTeamAccessRequest(email: string): Promise<HQTeamMember> {
  const member = await getHQTeamMemberByEmail(email);
  if (!member) throw new Error("Access request not found.");
  if (member.status === "active") throw new Error("This team member is already active.");

  const now = new Date().toISOString();
  const setvaId = member.setvaId || (await nextSetvaId());

  return saveMember(
    {
      ...member,
      setvaId,
      status: "approved",
      sessionVersion: member.sessionVersion + 1,
      approvedAt: now,
      updatedAt: now,
    },
    "approved",
  );
}

export async function activateHQTeamAccount(input: {
  setvaId: string;
  email: string;
  passwordHash: string;
}): Promise<HQTeamMember> {
  const member = await getHQTeamMemberBySetvaId(input.setvaId);
  if (!member) throw new Error("SETVA ID not found.");
  if (normalizeEmail(member.email) !== normalizeEmail(input.email)) {
    throw new Error("Email does not match this SETVA ID.");
  }
  if (member.status !== "approved" && member.status !== "active") {
    throw new Error("This SETVA ID is not approved yet.");
  }

  const now = new Date().toISOString();
  return saveMember(
    {
      ...member,
      passwordHash: input.passwordHash,
      status: "active",
      sessionVersion: member.sessionVersion + 1,
      activatedAt: member.activatedAt || now,
      updatedAt: now,
    },
    "active",
  );
}

export async function issueHQTeamMember(input: {
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  forceRelogin?: boolean;
}): Promise<HQTeamMember> {
  const existing = await getHQTeamMemberByEmail(input.email);
  const now = new Date().toISOString();
  const setvaId = existing?.setvaId || (await nextSetvaId());
  const sessionVersion = (existing?.sessionVersion ?? 0) + (input.forceRelogin ? 1 : 0);

  return saveMember(
    {
      setvaId,
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      passwordHash: input.passwordHash ?? existing?.passwordHash ?? "",
      status: input.passwordHash || existing?.passwordHash ? "active" : "approved",
      sessionVersion: sessionVersion || 1,
      requestedAt: existing?.requestedAt ?? now,
      approvedAt: existing?.approvedAt || now,
      activatedAt: input.passwordHash ? now : existing?.activatedAt ?? "",
      updatedAt: now,
    },
    input.passwordHash || existing?.passwordHash ? "active" : "approved",
  );
}

export async function incrementHQTeamSessionVersion(email: string): Promise<HQTeamMember | null> {
  const member = await getHQTeamMemberByEmail(email);
  if (!member) return null;

  return saveMember(
    {
      ...member,
      sessionVersion: member.sessionVersion + 1,
      updatedAt: new Date().toISOString(),
    },
    member.status,
  );
}
