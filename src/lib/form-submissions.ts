import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase/server";

export const FORM_TYPES = {
  mediaCredentials: "media_credentials",
  volunteers: "volunteers",
  ambassadors: "ambassadors",
  nominees: "nominees",
  nomineeCategories: "nominee_categories",
  nomineePageEntries: "nominee_page_entries",
  nomineeMagazineArticles: "nominee_magazine_articles",
  nomineeVotingSetups: "nominee_voting_setups",
  nomineeMediaAssets: "nominee_media_assets",
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
  contactEmail?: string | null;
  contactName?: string | null;
  payload?: Record<string, unknown>;
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
  if (input.contactEmail !== undefined) patch.contact_email = input.contactEmail;
  if (input.contactName !== undefined) patch.contact_name = input.contactName;
  if (input.payload !== undefined) patch.payload = input.payload;
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

export async function deleteFormSubmission(
  externalId: string,
  formType: FormType,
): Promise<boolean> {
  const client = supabaseAdmin();
  if (!client) return false;

  const { error } = await client
    .from("form_submissions")
    .delete()
    .eq("external_id", externalId)
    .eq("form_type", formType);

  if (error) throw error;
  return true;
}

export async function upsertFormSubmissionByExternalId(
  input: CreateFormSubmissionInput & { externalId: string },
): Promise<FormSubmissionRecord | null> {
  const existing = await getFormSubmissionByExternalId(input.externalId, input.formType);
  if (existing) {
    const nextPayload = input.payload;
    const client = supabaseAdmin();
    if (!client) return null;

    const { data, error } = await client
      .from("form_submissions")
      .update({
        status: input.status ?? existing.status,
        contact_email: input.contactEmail ?? existing.contact_email,
        contact_name: input.contactName ?? existing.contact_name,
        payload: nextPayload,
        admin_data: input.adminData ?? existing.admin_data,
        post_event_data: input.postEventData ?? existing.post_event_data,
      })
      .eq("external_id", input.externalId)
      .eq("form_type", input.formType)
      .select("*")
      .single();

    if (error) throw error;
    return data as FormSubmissionRecord;
  }

  return createFormSubmission(input);
}
