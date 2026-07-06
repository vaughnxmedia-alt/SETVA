import {
  createFormSubmission,
  type CreateFormSubmissionInput,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function persistFormSubmission(
  input: CreateFormSubmissionInput,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Form storage is not configured");
  }
  const record = await createFormSubmission(input);
  if (!record) {
    throw new Error("Failed to save form submission");
  }
}
