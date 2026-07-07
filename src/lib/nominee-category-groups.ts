import type { NomineeCategory, NomineePageEntry } from "@/lib/nominees";

/** Category video uploads apply to every group except Special awards. */
export function categoryExpectsVideo(category: Pick<NomineeCategory, "title">): boolean {
  const title = category.title.trim();
  if (!title) return false;
  return !title.startsWith("Special:");
}

export function categoryIsSpecialAward(category: Pick<NomineeCategory, "title">): boolean {
  return category.title.trim().startsWith("Special:");
}

/** Only Special award categories may store nominee graphics on the public page. */
export function categoryAllowsNomineeGraphic(category: Pick<NomineeCategory, "title"> | null | undefined): boolean {
  return Boolean(category && categoryIsSpecialAward(category));
}

export function nomineePageEntryWithoutDisallowedGraphic<
  T extends Pick<NomineePageEntry, "nomineeGraphicMediaId" | "nomineeGraphicUrl">,
>(input: T, category: Pick<NomineeCategory, "title"> | null | undefined): T {
  if (categoryAllowsNomineeGraphic(category)) return input;
  return { ...input, nomineeGraphicMediaId: "", nomineeGraphicUrl: "" };
}
