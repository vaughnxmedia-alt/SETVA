import { randomBytes } from "crypto";
import {
  createFormSubmission,
  deleteFormSubmission,
  FORM_TYPES,
  formStorageMode,
  getFormSubmissionByExternalId,
  listFormSubmissions,
  updateFormSubmission,
  type FormSubmissionRecord,
  type FormType,
} from "@/lib/form-submissions";
import { categoryExpectsVideo } from "@/lib/nominee-category-groups";
import { categoryById, listNomineeCategories } from "@/lib/nominee-categories-store";
import { listNominees } from "@/lib/nominees-store";
import { ticketPartnerTrackingPath, slugifyTicketPartner } from "@/lib/ticket-partner/links";
import { ticketPurchaseHref } from "@/lib/ticket-sales";
import type {
  NomineeMagazineArticle,
  NomineeMediaAsset,
  NomineePageEntry,
  NomineeVotingSetup,
  PublicNomineePageCategory,
} from "@/lib/nominees";

export type PublishQueueItem = {
  id: string;
  workflow: "Nominee Page" | "Magazine" | "Category Video" | "Voting";
  status: "Missing" | "Draft" | "Ready" | "Published";
  title: string;
  detail: string;
};

type WorkflowRecord =
  | NomineePageEntry
  | NomineeMagazineArticle
  | NomineeVotingSetup
  | NomineeMediaAsset;

function createWorkflowId(prefix: string): string {
  return `${prefix}_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function withRecordDates<T extends Record<string, unknown>>(
  id: string,
  payload: T,
  record: FormSubmissionRecord,
): T & { id: string; submittedAt: string; updatedAt: string } {
  return {
    ...payload,
    id,
    submittedAt: record.submitted_at,
    updatedAt: record.updated_at,
  };
}

function fromRecord<T extends WorkflowRecord>(record: FormSubmissionRecord): T {
  return withRecordDates(
    record.external_id ?? record.id,
    record.payload,
    record,
  ) as T;
}

async function listWorkflow<T extends WorkflowRecord>(formType: FormType): Promise<T[]> {
  if (formStorageMode() !== "supabase") return [];
  const records = await listFormSubmissions(formType);
  return records.map((record) => fromRecord<T>(record));
}

async function saveWorkflow<T extends WorkflowRecord>(
  formType: FormType,
  prefix: string,
  input: Omit<T, "id" | "submittedAt" | "updatedAt">,
  status: string,
  id?: string,
): Promise<T> {
  if (formStorageMode() !== "supabase") {
    throw new Error("Nominee workflow storage is not configured");
  }

  const externalId = id || createWorkflowId(prefix);
  const payload = input as Record<string, unknown>;
  const existing = await getFormSubmissionByExternalId(externalId, formType);
  const record = existing
    ? await updateFormSubmission(externalId, formType, { status, payload })
    : await createFormSubmission({
        externalId,
        formType,
        status,
        contactName: contactNameForWorkflow(payload),
        payload,
      });

  if (!record) throw new Error("Failed to save nominee workflow record");
  return fromRecord<T>(record);
}

function contactNameForWorkflow(payload: Record<string, unknown>): string {
  return String(
    payload.articleTitle ??
      payload.fileName ??
      payload.nomineeId ??
      payload.categoryId ??
      "SETVA nominee workflow",
  );
}

export async function listNomineePageEntries(): Promise<NomineePageEntry[]> {
  return listWorkflow<NomineePageEntry>(FORM_TYPES.nomineePageEntries);
}

export async function saveNomineePageEntry(
  input: Omit<NomineePageEntry, "id" | "submittedAt" | "updatedAt">,
  id?: string,
): Promise<NomineePageEntry> {
  return saveWorkflow<NomineePageEntry>(
    FORM_TYPES.nomineePageEntries,
    "nom_page",
    input,
    input.status.toLowerCase(),
    id,
  );
}

export async function deleteNomineePageEntry(id: string): Promise<boolean> {
  return deleteFormSubmission(id, FORM_TYPES.nomineePageEntries);
}

export async function listNomineeMagazineArticles(): Promise<NomineeMagazineArticle[]> {
  return listWorkflow<NomineeMagazineArticle>(FORM_TYPES.nomineeMagazineArticles);
}

export async function saveNomineeMagazineArticle(
  input: Omit<NomineeMagazineArticle, "id" | "submittedAt" | "updatedAt">,
  id?: string,
): Promise<NomineeMagazineArticle> {
  return saveWorkflow<NomineeMagazineArticle>(
    FORM_TYPES.nomineeMagazineArticles,
    "nom_article",
    input,
    input.articleStatus.toLowerCase(),
    id,
  );
}

export async function deleteNomineeMagazineArticle(id: string): Promise<boolean> {
  return deleteFormSubmission(id, FORM_TYPES.nomineeMagazineArticles);
}

export async function listNomineeVotingSetups(): Promise<NomineeVotingSetup[]> {
  return listWorkflow<NomineeVotingSetup>(FORM_TYPES.nomineeVotingSetups);
}

export async function saveNomineeVotingSetup(
  input: Omit<NomineeVotingSetup, "id" | "submittedAt" | "updatedAt">,
  id?: string,
): Promise<NomineeVotingSetup> {
  return saveWorkflow<NomineeVotingSetup>(
    FORM_TYPES.nomineeVotingSetups,
    "nom_vote",
    input,
    input.votingStatus.toLowerCase(),
    id,
  );
}

export async function deleteNomineeVotingSetup(id: string): Promise<boolean> {
  return deleteFormSubmission(id, FORM_TYPES.nomineeVotingSetups);
}

export async function listNomineeMediaAssets(): Promise<NomineeMediaAsset[]> {
  return listWorkflow<NomineeMediaAsset>(FORM_TYPES.nomineeMediaAssets);
}

export async function saveNomineeMediaAsset(
  input: Omit<NomineeMediaAsset, "id" | "submittedAt" | "updatedAt">,
  id?: string,
): Promise<NomineeMediaAsset> {
  return saveWorkflow<NomineeMediaAsset>(
    FORM_TYPES.nomineeMediaAssets,
    "nom_media",
    input,
    input.publicStatus.toLowerCase(),
    id,
  );
}

export async function deleteNomineeMediaAsset(id: string): Promise<boolean> {
  return deleteFormSubmission(id, FORM_TYPES.nomineeMediaAssets);
}

function publicHostedMediaUrl(...candidates: (string | undefined | null)[]): string {
  for (const raw of candidates) {
    const url = raw?.trim() ?? "";
    if (!url) continue;
    // Never embed data: URIs on the public site — a single base64 graphic can be
    // several MB and breaks Next.js caching plus mobile page loads.
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
  }
  return "";
}

export async function listPublishedNomineePageCategories(): Promise<PublicNomineePageCategory[]> {
  const [categories, nominees, entries, media] = await Promise.all([
    listNomineeCategories(),
    listNominees(),
    listNomineePageEntries(),
    listNomineeMediaAssets(),
  ]);

  const nomineeById = new Map(nominees.map((nominee) => [nominee.id, nominee]));
  const mediaById = new Map(media.map((asset) => [asset.id, asset]));
  const published = entries
    .filter((entry) => entry.publishToNomineePage && entry.status === "Published")
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return categories
    .filter((category) => category.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => {
      const videoAsset = category.videoMediaId ? mediaById.get(category.videoMediaId) : null;
      const videoSrc = category.publishVideo
        ? category.videoUrl || videoAsset?.fileUrl || ""
        : "";

      const allEntries = published
        .filter((entry) => entry.categoryId === category.id)
        .map((entry) => {
          const asset = entry.nomineeGraphicMediaId
            ? mediaById.get(entry.nomineeGraphicMediaId)
            : null;
          const imageSrc = publicHostedMediaUrl(asset?.fileUrl, entry.nomineeGraphicUrl);
          const nomineeRecord = nomineeById.get(entry.nomineeId);
          const slug = nomineeRecord
            ? slugifyTicketPartner(nomineeRecord.name, nomineeRecord.id)
            : "";
          const ticketHref = slug ? ticketPartnerTrackingPath(slug) : ticketPurchaseHref();
          return {
            id: entry.id,
            nomineeId: entry.nomineeId,
            imageSrc,
            nomineeName: nomineeRecord?.name ?? "Nominee",
            ticketHref,
            hasGraphic: Boolean(imageSrc),
          };
        });

      const graphicEntries = allEntries.filter((entry) => entry.hasGraphic);
      // Categories with a video also surface graphic-less nominees as calling-card
      // name tags so they stay visible and votable until graphics are added in HQ.
      // Categories without a video remain graphics-only.
      const nominees = videoSrc ? allEntries : graphicEntries;

      return {
        id: category.id,
        title: category.title,
        videoSrc,
        videoPoster: videoSrc
          ? publicHostedMediaUrl(category.videoPosterUrl, graphicEntries[0]?.imageSrc)
          : "",
        imageSrcs: graphicEntries.map((entry) => entry.imageSrc),
        nominees,
      };
    })
    // Show a category if it has at least one graphic nominee, or it has a video
    // with at least one published nominee (name tags allow voting).
    .filter(
      (category) =>
        category.imageSrcs.length > 0 ||
        (Boolean(category.videoSrc) && category.nominees.length > 0),
    );
}

export async function listPublishedNomineeMagazineArticles(): Promise<NomineeMagazineArticle[]> {
  const articles = await listNomineeMagazineArticles();
  return articles
    .filter((article) => article.publishToMagazine && article.articleStatus === "Published")
    .sort((a, b) => {
      const aDate = new Date(a.publishDate || a.submittedAt).getTime();
      const bDate = new Date(b.publishDate || b.submittedAt).getTime();
      return bDate - aDate;
    });
}

export async function listOpenVotingSetups(): Promise<NomineeVotingSetup[]> {
  const now = Date.now();
  const setups = await listNomineeVotingSetups();
  return setups.filter((setup) => {
    if (setup.votingStatus !== "Published") return false;
    const open = setup.votingOpenDate ? new Date(setup.votingOpenDate).getTime() : 0;
    const close = setup.votingCloseDate ? new Date(setup.votingCloseDate).getTime() : Infinity;
    return now >= open && now <= close;
  });
}

export async function getNomineePublishQueue(): Promise<PublishQueueItem[]> {
  const [categories, pageEntries, articles, votingSetups] = await Promise.all([
    listNomineeCategories(),
    listNomineePageEntries(),
    listNomineeMagazineArticles(),
    listNomineeVotingSetups(),
  ]);

  const items: PublishQueueItem[] = [];

  for (const entry of pageEntries) {
    if (entry.status === "Ready") {
      items.push({
        id: entry.id,
        workflow: "Nominee Page",
        status: "Ready",
        title: "Nominee page entry waiting for review",
        detail: "Review graphic before publishing.",
      });
    }
    if (entry.status === "Published") {
      items.push({
        id: entry.id,
        workflow: "Nominee Page",
        status: "Published",
        title: "Nominee page entry published",
        detail: "Published nominee page item.",
      });
    }
    if (!entry.nomineeGraphicMediaId && !entry.nomineeGraphicUrl) {
      items.push({
        id: `${entry.id}-graphic`,
        workflow: "Nominee Page",
        status: "Missing",
        title: "Nominee graphic missing",
        detail: "Add a nominee graphic before publishing this entry.",
      });
    }
  }

  for (const article of articles) {
    if (article.articleStatus === "Ready") {
      items.push({
        id: article.id,
        workflow: "Magazine",
        status: "Ready",
        title: article.articleTitle,
        detail: "Magazine article is not published yet.",
      });
    }
    if (article.articleStatus === "Published") {
      items.push({
        id: article.id,
        workflow: "Magazine",
        status: "Published",
        title: article.articleTitle,
        detail: article.publishDate || "Published magazine article.",
      });
    }
  }

  for (const category of categories) {
    if (
      category.publishVideo &&
      !category.videoUrl &&
      !category.videoMediaId &&
      categoryExpectsVideo(category)
    ) {
      items.push({
        id: `${category.id}-video`,
        workflow: "Category Video",
        status: "Missing",
        title: category.title,
        detail: "Category video is missing.",
      });
    }
  }

  for (const setup of votingSetups) {
    const category = categoryById(categories, setup.categoryId);
    if (!setup.nomineeIds.length || !setup.votingOpenDate || !setup.votingCloseDate) {
      items.push({
        id: setup.id,
        workflow: "Voting",
        status: "Missing",
        title: category?.title ?? "Voting setup",
        detail: "Voting needs nominees plus open and close dates.",
      });
    }
    if (setup.votingStatus === "Published") {
      items.push({
        id: `${setup.id}-open`,
        workflow: "Voting",
        status: "Published",
        title: category?.title ?? "Voting setup",
        detail: "Voting is open.",
      });
    }
  }

  return items;
}
