import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { listNomineeCategories, saveNomineeCategories } from "@/lib/nominee-categories-store";
import {
  resolveCategoryIdForImport,
  slugifyNominationCategory,
  type NominationMediaImportRow,
} from "@/lib/nomination-media-import";
import type { NomineeCategory } from "@/lib/nominees";
import { upsertNominee } from "@/lib/nominees-store";
import { saveNomineePageEntry } from "@/lib/nominee-workflows-store";
import { formStorageMode } from "@/lib/form-submissions";

export type NominationMediaImportInput = {
  rows: NominationMediaImportRow[];
  files: Map<string, Buffer>;
  addedBy?: { name: string; email: string };
};

export type NominationMediaImportResult = {
  categories: number;
  nominees: number;
  pageEntries: number;
  skipped: string[];
};

export async function importNominationMediaPackage(
  input: NominationMediaImportInput,
): Promise<NominationMediaImportResult> {
  if (formStorageMode() !== "supabase") {
    throw new Error("Nominee storage is not configured");
  }

  const existingCategories = await listNomineeCategories();
  const categoryById = new Map(existingCategories.map((category) => [category.id, category]));
  let nextSortOrder = existingCategories.length;
  const skipped: string[] = [];
  let nominees = 0;
  let pageEntries = 0;

  for (const row of input.rows) {
    if (!row.nomineeName.trim()) {
      skipped.push(`${row.categoryTitle}: missing nominee name.`);
      continue;
    }
    if (!row.graphicFileName) {
      skipped.push(`${row.categoryTitle}: missing nominee graphic.`);
      continue;
    }

    const graphicBuffer = input.files.get(row.graphicFileName);
    if (!graphicBuffer) {
      skipped.push(`${row.categoryTitle}: graphic file "${row.graphicFileName}" not found.`);
      continue;
    }

    const categoryId = resolveCategoryIdForImport(row.categoryTitle, [...categoryById.values()]);
    const categoryDir = path.join(process.cwd(), "public", "nominations", categoryId);
    await mkdir(categoryDir, { recursive: true });

    let videoUrl = categoryById.get(categoryId)?.videoUrl ?? "";
    if (row.videoFileName) {
      const videoBuffer = input.files.get(row.videoFileName);
      if (videoBuffer) {
        const videoExt = path.extname(row.videoFileName).toLowerCase() || ".mp4";
        const videoPath = path.join(categoryDir, `video${videoExt}`);
        await writeFile(videoPath, videoBuffer);
        videoUrl = `/nominations/${categoryId}/video${videoExt}`;
      }
    }

    const graphicExt = path.extname(row.graphicFileName).toLowerCase() || ".png";
    const graphicPath = path.join(categoryDir, `1${graphicExt}`);
    await writeFile(graphicPath, graphicBuffer);
    const graphicUrl = `/nominations/${categoryId}/1${graphicExt}`;

    const existingCategory = categoryById.get(categoryId);
    const category: NomineeCategory = {
      id: categoryId,
      title: row.categoryTitle,
      description: existingCategory?.description ?? "",
      sortOrder: existingCategory?.sortOrder ?? nextSortOrder,
      status: row.publishCategoryVideo ? "Published" : existingCategory?.status ?? "Draft",
      videoMediaId: existingCategory?.videoMediaId ?? "",
      videoUrl,
      publishVideo: row.publishCategoryVideo && Boolean(videoUrl),
      active: true,
    };

    if (!existingCategory) {
      nextSortOrder += 1;
    }
    categoryById.set(categoryId, category);

    const nomineeId = `nom_import_${slugifyNominationCategory(row.categoryTitle)}_${slugifyNominationCategory(row.nomineeName)}`;
    const pageEntryId = `nom_page_import_${slugifyNominationCategory(row.categoryTitle)}_${slugifyNominationCategory(row.nomineeName)}`;

    await upsertNominee(
      {
        name: row.nomineeName.trim(),
        categoryId,
        cityRegion: "",
        contactEmail: "",
        contactPhone: "",
        socialLinks: [],
        internalNotes: `Imported from nomination media package (${row.graphicFileName}).`,
        confirmationStatus: "Pending",
      },
      nomineeId,
      input.addedBy,
    );
    nominees += 1;

    await saveNomineePageEntry(
      {
        nomineeId,
        categoryId,
        nomineeGraphicMediaId: "",
        nomineeGraphicUrl: graphicUrl,
        displayOrder: 1,
        publishToNomineePage: row.publishNominee,
        status: row.publishNominee ? "Published" : "Ready",
        createdByName: input.addedBy?.name ?? "SETVA Import",
        createdByEmail: input.addedBy?.email ?? "",
      },
      pageEntryId,
    );
    pageEntries += 1;
  }

  const categories = await saveNomineeCategories(
    Array.from(categoryById.values()).sort((a, b) => a.sortOrder - b.sortOrder),
  );

  return {
    categories: categories.length,
    nominees,
    pageEntries,
    skipped,
  };
}

export async function seedNominationBatch2(addedBy?: {
  name: string;
  email: string;
}): Promise<NominationMediaImportResult> {
  const {
    nominationBatch2Categories,
    nominationBatch2NomineeSeed,
    batch2SeedNomineeId,
    batch2SeedPageEntryId,
  } = await import("@/lib/nominee-public-page-seed-2");

  if (formStorageMode() !== "supabase") {
    throw new Error("Nominee storage is not configured");
  }

  const existingCategories = await listNomineeCategories();
  const mergedCategories = mergeCategories(existingCategories, nominationBatch2Categories);
  await saveNomineeCategories(mergedCategories);

  let nominees = 0;
  let pageEntries = 0;

  for (const entry of nominationBatch2NomineeSeed) {
    const nomineeId = batch2SeedNomineeId(entry.categoryId, entry.displayOrder);
    const pageEntryId = batch2SeedPageEntryId(entry.categoryId, entry.displayOrder);

    await upsertNominee(
      {
        name: entry.name,
        categoryId: entry.categoryId,
        cityRegion: "",
        contactEmail: "",
        contactPhone: "",
        socialLinks: [],
        internalNotes: "Imported from NOMINATION VIDEO-2 delivery.",
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
    categories: mergedCategories.length,
    nominees,
    pageEntries,
    skipped: [],
  };
}

function mergeCategories(
  existing: NomineeCategory[],
  incoming: NomineeCategory[],
): NomineeCategory[] {
  const byId = new Map(existing.map((category) => [category.id, category]));

  for (const category of incoming) {
    const current = byId.get(category.id);
    byId.set(category.id, current ? { ...current, ...category, sortOrder: current.sortOrder } : category);
  }

  return Array.from(byId.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}
