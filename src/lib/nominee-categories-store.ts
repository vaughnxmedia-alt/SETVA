import { nominationCategories } from "@/lib/nominations";
import {
  FORM_TYPES,
  formStorageMode,
  getFormSubmissionByExternalId,
  upsertFormSubmissionByExternalId,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";
import { type NomineeCategory } from "@/lib/nominees";

const CATEGORIES_CONFIG_ID = "setva-nominee-categories";

function seedCategories(): NomineeCategory[] {
  return nominationCategories.map((category, index) => ({
    id: category.id,
    title: category.title,
    description: "",
    sortOrder: index,
    status: "Draft",
    videoMediaId: "",
    videoUrl: category.videoSrc,
    publishVideo: false,
    active: true,
  }));
}

function categoriesFromRecord(record: FormSubmissionRecord): NomineeCategory[] {
  const payload = record.payload;
  if (!Array.isArray(payload.categories)) return [];
  return payload.categories as NomineeCategory[];
}

export async function listNomineeCategories(): Promise<NomineeCategory[]> {
  if (formStorageMode() !== "supabase") return seedCategories();

  const record = await getFormSubmissionByExternalId(
    CATEGORIES_CONFIG_ID,
    FORM_TYPES.nomineeCategories,
  );

  if (!record) return seedCategories();
  const stored = categoriesFromRecord(record);
  return stored.length ? stored : seedCategories();
}

export async function saveNomineeCategories(
  categories: NomineeCategory[],
): Promise<NomineeCategory[]> {
  if (formStorageMode() !== "supabase") {
    throw new Error("Nominee category storage is not configured");
  }

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const record = await upsertFormSubmissionByExternalId({
    externalId: CATEGORIES_CONFIG_ID,
    formType: FORM_TYPES.nomineeCategories,
    status: "active",
    contactName: "SETVA Nominee Categories",
    payload: { categories: sorted },
  });

  if (!record) {
    throw new Error("Failed to save nominee categories");
  }

  return categoriesFromRecord(record);
}

export function categoryTitleById(
  categories: NomineeCategory[],
  categoryId: string,
): string {
  return categories.find((c) => c.id === categoryId)?.title ?? categoryId;
}

export function resolveCategoryId(
  categories: NomineeCategory[],
  value: string,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const byId = categories.find((c) => c.id === trimmed);
  if (byId) return byId.id;

  const lower = trimmed.toLowerCase();
  const byTitle = categories.find((c) => c.title.toLowerCase() === lower);
  return byTitle?.id ?? null;
}

export function categoryById(
  categories: NomineeCategory[],
  categoryId: string,
): NomineeCategory | null {
  return categories.find((c) => c.id === categoryId) ?? null;
}
