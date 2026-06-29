export const nomineeContactStatusOptions = [
  "Not contacted",
  "Contacted",
  "Responded",
  "Unreachable",
] as const;

export const nomineeConfirmationStatusOptions = [
  "Pending",
  "Confirmed",
  "Declined",
  "Attending",
] as const;

export const nomineeCategoryStatusOptions = [
  "Draft",
  "Ready",
  "Published",
] as const;

export const nomineePageStatusOptions = [
  "Draft",
  "Ready",
  "Published",
] as const;

export const nomineeArticleStatusOptions = [
  "Draft",
  "Ready",
  "Published",
] as const;

export const nomineeVotingStatusOptions = [
  "Draft",
  "Ready",
  "Published",
] as const;

export const mediaUsageTypeOptions = [
  "Nominee Page",
  "Magazine",
  "Voting",
  "Sponsor",
  "Press",
  "General",
] as const;

export type NomineeContactStatus = (typeof nomineeContactStatusOptions)[number];
export type NomineeConfirmationStatus = (typeof nomineeConfirmationStatusOptions)[number];
export type NomineeCategoryStatus = (typeof nomineeCategoryStatusOptions)[number];
export type NomineePageStatus = (typeof nomineePageStatusOptions)[number];
export type NomineeArticleStatus = (typeof nomineeArticleStatusOptions)[number];
export type NomineeVotingStatus = (typeof nomineeVotingStatusOptions)[number];
export type MediaUsageType = (typeof mediaUsageTypeOptions)[number];

export type NomineeCategory = {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  status: NomineeCategoryStatus;
  videoMediaId: string;
  videoUrl: string;
  publishVideo: boolean;
  active: boolean;
};

export type NomineeData = {
  name: string;
  categoryId: string;
  cityRegion: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: string[];
  internalNotes: string;
  confirmationStatus: NomineeConfirmationStatus;
};

export type NomineeAdminFields = {
  addedByName: string;
  addedByEmail: string;
  ticketPartnerSlug: string;
};

export type NomineeRecordFull = NomineeData &
  NomineeAdminFields & {
    id: string;
    submittedAt: string;
    updatedAt: string;
  };

export type NomineePageEntry = {
  id: string;
  nomineeId: string;
  categoryId: string;
  nomineeGraphicMediaId: string;
  nomineeGraphicUrl: string;
  displayOrder: number;
  publishToNomineePage: boolean;
  status: NomineePageStatus;
  createdByName: string;
  createdByEmail: string;
  submittedAt: string;
  updatedAt: string;
};

export type NomineeMagazineArticle = {
  id: string;
  nomineeId: string;
  articleTitle: string;
  nomineeBio: string;
  articleBody: string;
  pullQuote: string;
  articleImageMediaId: string;
  articleImageUrl: string;
  publishToMagazine: boolean;
  articleStatus: NomineeArticleStatus;
  publishDate: string;
  slug: string;
  createdByName: string;
  createdByEmail: string;
  submittedAt: string;
  updatedAt: string;
};

export type NomineeVotingSetup = {
  id: string;
  categoryId: string;
  nomineeIds: string[];
  votingOpenDate: string;
  votingCloseDate: string;
  votingStatus: NomineeVotingStatus;
  createdByName: string;
  createdByEmail: string;
  submittedAt: string;
  updatedAt: string;
};

export type NomineeMediaAsset = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedByName: string;
  uploadedByEmail: string;
  uploadDate: string;
  assignedNomineeId: string;
  assignedCategoryId: string;
  usageType: MediaUsageType;
  publicStatus: "Public" | "Private";
  submittedAt: string;
  updatedAt: string;
};

export type PublicNomineePageCategory = {
  id: string;
  title: string;
  videoSrc: string;
  imageSrcs: string[];
  nominees: {
    id: string;
    imageSrc: string;
    nomineeName: string;
  }[];
};

export function defaultNomineeAdminFields(
  addedBy?: { name: string; email: string },
): NomineeAdminFields {
  return {
    addedByName: addedBy?.name ?? "",
    addedByEmail: addedBy?.email ?? "",
    ticketPartnerSlug: "",
  };
}

export function slugifyNomineeStatus(status: string): string {
  return status.toLowerCase().replace(/\s+/g, "_");
}

export function parseNomineeInput(body: Record<string, unknown>): NomineeData | null {
  const name = String(body.name ?? "").trim();
  const categoryId = String(body.categoryId ?? "").trim();
  if (!name || !categoryId) return null;

  return {
    name,
    categoryId,
    cityRegion: String(body.cityRegion ?? body.city ?? "").trim(),
    contactEmail: String(body.contactEmail ?? body.email ?? "").trim(),
    contactPhone: String(body.contactPhone ?? body.phone ?? "").trim(),
    socialLinks: parseStringList(body.socialLinks),
    internalNotes: String(body.internalNotes ?? "").trim(),
    confirmationStatus: parseOption(
      body.confirmationStatus,
      nomineeConfirmationStatusOptions,
      "Pending",
    ),
  };
}

export function parseNomineeAdminUpdate(body: Record<string, unknown>): {
  data?: Partial<NomineeData>;
  admin?: Partial<NomineeAdminFields>;
} {
  const data: Partial<NomineeData> = {};
  const admin: Partial<NomineeAdminFields> = {};

  for (const key of ["name", "categoryId", "cityRegion", "contactEmail", "contactPhone", "internalNotes"] as const) {
    if (body[key] !== undefined) {
      data[key] = String(body[key] ?? "").trim();
    }
  }

  if (body.email !== undefined && body.contactEmail === undefined) {
    data.contactEmail = String(body.email ?? "").trim();
  }
  if (body.phone !== undefined && body.contactPhone === undefined) {
    data.contactPhone = String(body.phone ?? "").trim();
  }
  if (body.city !== undefined && body.cityRegion === undefined) {
    data.cityRegion = String(body.city ?? "").trim();
  }
  if (body.socialLinks !== undefined) {
    data.socialLinks = parseStringList(body.socialLinks);
  }
  if (body.confirmationStatus !== undefined) {
    data.confirmationStatus = parseOption(
      body.confirmationStatus,
      nomineeConfirmationStatusOptions,
      "Pending",
    );
  }

  return {
    data: Object.keys(data).length ? data : undefined,
    admin: Object.keys(admin).length ? admin : undefined,
  };
}

export function parseNomineeCategories(body: unknown): NomineeCategory[] | null {
  if (!Array.isArray(body)) return null;

  const categories: NomineeCategory[] = [];
  for (const [index, item] of body.entries()) {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const title = String(row.title ?? "").trim();
    if (!title) return null;
    const id = String(row.id ?? "").trim() || `category-${index + 1}`;
    categories.push({
      id,
      title,
      description: String(row.description ?? "").trim(),
      sortOrder: Number(row.sortOrder ?? index),
      status: parseOption(row.status, nomineeCategoryStatusOptions, "Draft"),
      videoMediaId: String(row.videoMediaId ?? "").trim(),
      videoUrl: String(row.videoUrl ?? "").trim(),
      publishVideo: parseBoolean(row.publishVideo),
      active: row.active !== false,
    });
  }

  return categories;
}

export function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseOption<const T extends readonly string[]>(
  value: unknown,
  options: T,
  fallback: T[number],
): T[number] {
  const next = String(value ?? "").trim();
  return options.includes(next) ? next : fallback;
}

export function parseBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "Yes";
}

export function parseNomineePageEntryInput(
  body: Record<string, unknown>,
  addedBy?: { name: string; email: string },
): Omit<NomineePageEntry, "id" | "submittedAt" | "updatedAt"> | null {
  const nomineeId = String(body.nomineeId ?? "").trim();
  const categoryId = String(body.categoryId ?? "").trim();
  if (!nomineeId || !categoryId) return null;

  return {
    nomineeId,
    categoryId,
    nomineeGraphicMediaId: String(body.nomineeGraphicMediaId ?? "").trim(),
    nomineeGraphicUrl: String(body.nomineeGraphicUrl ?? "").trim(),
    displayOrder: Number(body.displayOrder ?? 0),
    publishToNomineePage: parseBoolean(body.publishToNomineePage),
    status: parseOption(body.status, nomineePageStatusOptions, "Draft"),
    createdByName: addedBy?.name ?? String(body.createdByName ?? "").trim(),
    createdByEmail: addedBy?.email ?? String(body.createdByEmail ?? "").trim(),
  };
}

export function parseNomineeMagazineArticleInput(
  body: Record<string, unknown>,
  addedBy?: { name: string; email: string },
): Omit<NomineeMagazineArticle, "id" | "submittedAt" | "updatedAt"> | null {
  const articleTitle = String(body.articleTitle ?? body.title ?? "").trim();
  if (!articleTitle) return null;

  const nomineeId = String(body.nomineeId ?? "").trim();

  return {
    nomineeId,
    articleTitle,
    nomineeBio: String(body.nomineeBio ?? "").trim(),
    articleBody: String(body.articleBody ?? "").trim(),
    pullQuote: String(body.pullQuote ?? "").trim(),
    articleImageMediaId: String(body.articleImageMediaId ?? "").trim(),
    articleImageUrl: String(body.articleImageUrl ?? "").trim(),
    publishToMagazine: parseBoolean(body.publishToMagazine),
    articleStatus: parseOption(body.articleStatus, nomineeArticleStatusOptions, "Draft"),
    publishDate: String(body.publishDate ?? "").trim(),
    slug: String(body.slug ?? slugifyNomineeStatus(articleTitle).replaceAll("_", "-")).trim(),
    createdByName: addedBy?.name ?? String(body.createdByName ?? "").trim(),
    createdByEmail: addedBy?.email ?? String(body.createdByEmail ?? "").trim(),
  };
}

export function parseNomineeVotingSetupInput(
  body: Record<string, unknown>,
  addedBy?: { name: string; email: string },
): Omit<NomineeVotingSetup, "id" | "submittedAt" | "updatedAt"> | null {
  const categoryId = String(body.categoryId ?? "").trim();
  if (!categoryId) return null;

  return {
    categoryId,
    nomineeIds: parseStringList(body.nomineeIds),
    votingOpenDate: String(body.votingOpenDate ?? "").trim(),
    votingCloseDate: String(body.votingCloseDate ?? "").trim(),
    votingStatus: parseOption(body.votingStatus, nomineeVotingStatusOptions, "Draft"),
    createdByName: addedBy?.name ?? String(body.createdByName ?? "").trim(),
    createdByEmail: addedBy?.email ?? String(body.createdByEmail ?? "").trim(),
  };
}

export function parseNomineeMediaAssetInput(
  body: Record<string, unknown>,
  addedBy?: { name: string; email: string },
): Omit<NomineeMediaAsset, "id" | "submittedAt" | "updatedAt"> | null {
  const fileName = String(body.fileName ?? "").trim();
  const fileUrl = String(body.fileUrl ?? "").trim();
  if (!fileName || !fileUrl) return null;

  return {
    fileName,
    fileType: String(body.fileType ?? "").trim(),
    fileSize: Number(body.fileSize ?? 0),
    fileUrl,
    uploadedByName: addedBy?.name ?? String(body.uploadedByName ?? "").trim(),
    uploadedByEmail: addedBy?.email ?? String(body.uploadedByEmail ?? "").trim(),
    uploadDate: String(body.uploadDate ?? new Date().toISOString()).trim(),
    assignedNomineeId: String(body.assignedNomineeId ?? "").trim(),
    assignedCategoryId: String(body.assignedCategoryId ?? "").trim(),
    usageType: parseOption(body.usageType, mediaUsageTypeOptions, "General"),
    publicStatus: parseOption(body.publicStatus, ["Public", "Private"] as const, "Private"),
  };
}
