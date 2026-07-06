import {
  FORM_TYPES,
  formStorageMode,
  getFormSubmissionByExternalId,
  upsertFormSubmissionByExternalId,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";
import { type NomineeCategory } from "@/lib/nominees";

const CATEGORIES_CONFIG_ID = "setva-nominee-categories";

function categoriesFromRecord(record: FormSubmissionRecord): NomineeCategory[] {
  const payload = record.payload;
  if (!Array.isArray(payload.categories)) return [];
  return payload.categories as NomineeCategory[];
}

export async function listNomineeCategories(): Promise<NomineeCategory[]> {
  if (formStorageMode() !== "supabase") return [];

  const record = await getFormSubmissionByExternalId(
    CATEGORIES_CONFIG_ID,
    FORM_TYPES.nomineeCategories,
  );

  if (!record) return [];
  return categoriesFromRecord(record);
}

function categoryIsComplete(category: NomineeCategory): boolean {
  return Boolean(category.videoUrl?.trim() && category.videoPosterUrl?.trim());
}

/**
 * Orders categories so the completed ones (video + thumbnail) sit at the top,
 * then renumbers sortOrder. The sort is stable and keyed on the existing
 * sortOrder, so already-completed categories keep their relative order and a
 * newly completed category lands at the bottom of the completed group.
 */
function orderCategoriesByCompletion(categories: NomineeCategory[]): NomineeCategory[] {
  return [...categories]
    .sort((a, b) => {
      const completeGap = Number(categoryIsComplete(b)) - Number(categoryIsComplete(a));
      if (completeGap !== 0) return completeGap;
      return a.sortOrder - b.sortOrder;
    })
    .map((category, index) => ({ ...category, sortOrder: index }));
}

export async function saveNomineeCategories(
  categories: NomineeCategory[],
): Promise<NomineeCategory[]> {
  if (formStorageMode() !== "supabase") {
    throw new Error("Nominee category storage is not configured");
  }

  const sorted = orderCategoriesByCompletion(categories);
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
