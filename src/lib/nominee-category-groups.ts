import type { NomineeCategory } from "@/lib/nominees";

/** Category video uploads apply to every group except Special awards. */
export function categoryExpectsVideo(category: Pick<NomineeCategory, "title">): boolean {
  const title = category.title.trim();
  if (!title) return false;
  return !title.startsWith("Special:");
}

export function categoryIsSpecialAward(category: Pick<NomineeCategory, "title">): boolean {
  return category.title.trim().startsWith("Special:");
}
