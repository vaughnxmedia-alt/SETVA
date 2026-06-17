import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/server";

export const FORM_TYPES = {
  mediaCredentials: "media_credentials",
  volunteers: "volunteers",
  ambassadors: "ambassadors",
  sponsorDeck: "sponsor_deck",
  sponsorIntake: "sponsor_intake",
  sponsorCheckoutConfirmed: "sponsor_checkout_confirmed",
  checkout: "checkout",
} as const;

export type FormType = (typeof FORM_TYPES)[keyof typeof FORM_TYPES];

export type FormSubmissionRecord = {
  id: string;
  external_id: string | null;
  form_type: FormType;
  site: string;
  status: string;
  contact_email: string | null;
  contact_name: string | null;
  payload: Record<string, unknown>;
  admin_data: Record<string, unknown>;
  post_event_data: Record<string, unknown>;
  submitted_at: string;
  updated_at: string;
  last_status_email_at: string | null;
};

export type CreateFormSubmissionInput = {
  externalId?: string;
  formType: FormType;
  site?: string;
  status?: string;
  contactEmail?: string;
  contactName?: string;
  payload: Record<string, unknown>;
  adminData?: Record<string, unknown>;
  postEventData?: Record<string, unknown>;
};

export type UpdateFormSubmissionInput = {
  status?: string;
  adminData?: Record<string, unknown>;
  postEventData?: Record<string, unknown>;
  lastStatusEmailAt?: string | null;
};

export function formStorageMode(): "supabase" | "local" {
  return isSupabaseConfigured() ? "supabase" : "local";
}

export async function createFormSubmission(
  input: CreateFormSubmissionInput,
): Promise<FormSubmissionRecord | null> {
  const client = supabaseAdmin();
  if (!client) return null;

  const { data, error } = await client
    .from("form_submissions")
    .insert({
      external_id: input.externalId ?? null,
      form_type: input.formType,
      site: input.site ?? "setva",
      status: input.status ?? "pending_review",
      contact_email: input.contactEmail ?? null,
      contact_name: input.contactName ?? null,
      payload: input.payload,
      admin_data: input.adminData ?? {},
      post_event_data: input.postEventData ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as FormSubmissionRecord;
}

export async function listFormSubmissions(
  formType: FormType,
): Promise<FormSubmissionRecord[]> {
  const client = supabaseAdmin();
  if (!client) return [];

  const { data, error } = await client
    .from("form_submissions")
    .select("*")
    .eq("form_type", formType)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as FormSubmissionRecord[];
}

export async function getFormSubmissionByExternalId(
  externalId: string,
  formType: FormType,
): Promise<FormSubmissionRecord | null> {
  const client = supabaseAdmin();
  if (!client) return null;

  const { data, error } = await client
    .from("form_submissions")
    .select("*")
    .eq("external_id", externalId)
    .eq("form_type", formType)
    .maybeSingle();

  if (error) throw error;
  return (data as FormSubmissionRecord | null) ?? null;
}

export async function updateFormSubmission(
  externalId: string,
  formType: FormType,
  input: UpdateFormSubmissionInput,
): Promise<FormSubmissionRecord | null> {
  const client = supabaseAdmin();
  if (!client) return null;

  const current = await getFormSubmissionByExternalId(externalId, formType);
  if (!current) return null;

  const patch: Record<string, unknown> = {};
  if (input.status !== undefined) patch.status = input.status;
  if (input.lastStatusEmailAt !== undefined) {
    patch.last_status_email_at = input.lastStatusEmailAt;
  }
  if (input.adminData !== undefined) {
    patch.admin_data = { ...current.admin_data, ...input.adminData };
  }
  if (input.postEventData !== undefined) {
    patch.post_event_data = { ...current.post_event_data, ...input.postEventData };
  }

  const { data, error } = await client
    .from("form_submissions")
    .update(patch)
    .eq("external_id", externalId)
    .eq("form_type", formType)
    .select("*")
    .single();

  if (error) throw error;
  return data as FormSubmissionRecord;
}
