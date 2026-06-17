import {
  createFormSubmission,
  type CreateFormSubmissionInput,
} from "@/lib/form-submissions";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function persistFormSubmission(
  input: CreateFormSubmissionInput,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await createFormSubmission(input);
}
