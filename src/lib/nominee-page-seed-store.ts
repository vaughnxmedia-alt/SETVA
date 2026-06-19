import { saveNomineeCategories } from "@/lib/nominee-categories-store";
import {
  publicPageNomineeCategories,
  publicPageNomineeSeed,
  seedNomineeId,
  seedPageEntryId,
} from "@/lib/nominee-public-page-seed";
import { upsertNominee } from "@/lib/nominees-store";
import { saveNomineePageEntry } from "@/lib/nominee-workflows-store";
import { formStorageMode } from "@/lib/form-submissions";

export type PublicPageSeedResult = {
  categories: number;
  nominees: number;
  pageEntries: number;
};

export async function seedPublicPageNominees(addedBy?: {
  name: string;
  email: string;
}): Promise<PublicPageSeedResult> {
  if (formStorageMode() !== "supabase") {
    throw new Error("Nominee storage is not configured");
  }

  const categories = await saveNomineeCategories(publicPageNomineeCategories());
  let nominees = 0;
  let pageEntries = 0;

  for (const entry of publicPageNomineeSeed) {
    const nomineeId = seedNomineeId(entry.categoryId, entry.displayOrder);
    const pageEntryId = seedPageEntryId(entry.categoryId, entry.displayOrder);
    const internalNotes = entry.workTitle
      ? `Imported from public nominations page. Work: ${entry.workTitle}.`
      : "Imported from public nominations page.";

    await upsertNominee(
      {
        name: entry.name,
        categoryId: entry.categoryId,
        cityRegion: "",
        contactEmail: "",
        contactPhone: "",
        socialLinks: [],
        internalNotes,
        confirmationStatus: "Pending",
      },
      nomineeId,
      addedBy,
    );
    nominees += 1;

    await saveNomineePageEntry(
      {
        nomineeId,
        categoryId: entry.categoryId,
        nomineeGraphicMediaId: "",
        nomineeGraphicUrl: entry.graphicUrl,
        displayOrder: entry.displayOrder,
        publishToNomineePage: true,
        status: "Published",
        createdByName: addedBy?.name ?? "SETVA Seed",
        createdByEmail: addedBy?.email ?? "",
      },
      pageEntryId,
    );
    pageEntries += 1;
  }

  return {
    categories: categories.length,
    nominees,
    pageEntries,
  };
}
