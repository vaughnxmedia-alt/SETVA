import {
  FORM_TYPES,
  formStorageMode,
  listFormSubmissions,
} from "@/lib/form-submissions";
import { upsertNominee } from "@/lib/nominees-store";
import {
  listNomineePageEntries,
  nomineePageEntryId,
  saveNomineePageEntry,
} from "@/lib/nominee-workflows-store";

export type OrphanPublishedEntry = {
  pageEntryId: string;
  nomineeId: string;
  categoryId: string;
  graphicUrl: string;
  recoveredName: string | null;
};

export type NomineeConsistencyReport = {
  nomineeCount: number;
  publishedPageEntryCount: number;
  orphanPublishedCount: number;
  orphans: OrphanPublishedEntry[];
};

export type RecoverOrphansResult = {
  restored: number;
  unpublished: number;
  skipped: number;
  details: string[];
};

async function nameFromTicketData(nomineeId: string): Promise<string | null> {
  const records = await listFormSubmissions(FORM_TYPES.ticketLinkEvents);
  for (const record of records) {
    const payload = record.payload as { sourceId?: string; sourceName?: string };
    if (payload.sourceId === nomineeId && payload.sourceName?.trim()) {
      return payload.sourceName.trim();
    }
  }

  const leads = await listFormSubmissions(FORM_TYPES.ticketPartnerLeads);
  for (const record of leads) {
    const payload = record.payload as { sourceId?: string; sourceName?: string };
    if (payload.sourceId === nomineeId && payload.sourceName?.trim()) {
      return payload.sourceName.trim();
    }
  }

  return null;
}

export async function listOrphanPublishedPageEntries(): Promise<OrphanPublishedEntry[]> {
  const [pageEntries, nominees] = await Promise.all([listNomineePageEntries(), listFormSubmissions(FORM_TYPES.nominees)]);
  const nomineeIds = new Set(nominees.map((record) => record.external_id).filter(Boolean) as string[]);

  const orphans: OrphanPublishedEntry[] = [];
  for (const entry of pageEntries) {
    if (!entry.publishToNomineePage || entry.status !== "Published") continue;
    if (nomineeIds.has(entry.nomineeId)) continue;
    orphans.push({
      pageEntryId: entry.id,
      nomineeId: entry.nomineeId,
      categoryId: entry.categoryId,
      graphicUrl: entry.nomineeGraphicUrl,
      recoveredName: await nameFromTicketData(entry.nomineeId),
    });
  }

  return orphans.sort((a, b) => a.recoveredName?.localeCompare(b.recoveredName ?? "") ?? 0);
}

export async function getNomineeConsistencyReport(): Promise<NomineeConsistencyReport> {
  const [nominees, pageEntries, orphans] = await Promise.all([
    listFormSubmissions(FORM_TYPES.nominees),
    listNomineePageEntries(),
    listOrphanPublishedPageEntries(),
  ]);

  const publishedPageEntryCount = pageEntries.filter(
    (entry) => entry.publishToNomineePage && entry.status === "Published",
  ).length;

  return {
    nomineeCount: nominees.length,
    publishedPageEntryCount,
    orphanPublishedCount: orphans.length,
    orphans,
  };
}

/** Recreate missing nominee records for published page entries. */
export async function recoverOrphanPublishedNominees(): Promise<RecoverOrphansResult> {
  if (formStorageMode() !== "supabase") {
    return { restored: 0, unpublished: 0, skipped: 0, details: ["Storage not configured."] };
  }

  const orphans = await listOrphanPublishedPageEntries();
  const details: string[] = [];
  let restored = 0;
  let unpublished = 0;
  let skipped = 0;

  for (const orphan of orphans) {
    const suffix = orphan.nomineeId.slice(-8);
    const name = orphan.recoveredName?.trim() || `Name needed (${suffix})`;

    if (!orphan.recoveredName) {
      details.push(`Restored placeholder for ${orphan.nomineeId} — update name in HQ.`);
    } else {
      details.push(`Restored ${name}.`);
    }

    await upsertNominee(
      {
        name,
        categoryId: orphan.categoryId,
        cityRegion: "",
        contactEmail: "",
        contactPhone: "",
        socialLinks: [],
        internalNotes: "Restored from published page entry after nominee record was missing.",
        confirmationStatus: "Confirmed",
      },
      orphan.nomineeId,
      { name: "SETVA HQ", email: "contactus@setvawards.com" },
    );

    await saveNomineePageEntry(
      {
        nomineeId: orphan.nomineeId,
        categoryId: orphan.categoryId,
        nomineeGraphicMediaId: "",
        nomineeGraphicUrl: orphan.graphicUrl,
        displayOrder: 0,
        publishToNomineePage: true,
        status: "Published",
        createdByName: "SETVA HQ",
        createdByEmail: "contactus@setvawards.com",
      },
      orphan.pageEntryId || nomineePageEntryId(orphan.nomineeId),
    );

    restored += 1;
  }

  return { restored, unpublished, skipped, details };
}

/** Keep page entry category aligned when a nominee is moved between categories in HQ. */
export async function syncNomineePageEntryCategory(
  nomineeId: string,
  categoryId: string,
): Promise<void> {
  const entries = await listNomineePageEntries();
  const entry = entries.find((item) => item.nomineeId === nomineeId);
  if (!entry || entry.categoryId === categoryId) return;

  await saveNomineePageEntry(
    {
      nomineeId: entry.nomineeId,
      categoryId,
      nomineeGraphicMediaId: entry.nomineeGraphicMediaId,
      nomineeGraphicUrl: entry.nomineeGraphicUrl,
      displayOrder: entry.displayOrder,
      publishToNomineePage: entry.publishToNomineePage,
      status: entry.status,
      createdByName: entry.createdByName,
      createdByEmail: entry.createdByEmail,
    },
    entry.id,
  );
}
