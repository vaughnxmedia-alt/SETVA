export const honoreeStatusOptions = ["Draft", "Ready", "Published"] as const;

export type HonoreeStatus = (typeof honoreeStatusOptions)[number];

export type Honoree = {
  id: string;
  name: string;
  awardTitle: string;
  graphicUrl: string;
  accomplishments: string; // sanitized rich-text HTML
  pullQuote: string;
  slug: string;
  displayOrder: number;
  publishToMagazine: boolean;
  status: HonoreeStatus;
  createdByName: string;
  createdByEmail: string;
  submittedAt: string;
  updatedAt: string;
};

export type PublicHonoree = {
  slug: string;
  name: string;
  awardTitle: string;
  graphicUrl: string;
  accomplishmentsHtml: string;
  pullQuote: string;
  publishedLabel: string;
};

function parseOption<const T extends readonly string[]>(
  value: unknown,
  options: T,
  fallback: T[number],
): T[number] {
  const next = String(value ?? "").trim();
  return options.includes(next) ? next : fallback;
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "Yes";
}

export function slugifyHonoree(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parseHonoreeInput(
  body: Record<string, unknown>,
  addedBy?: { name: string; email: string },
): Omit<Honoree, "id" | "submittedAt" | "updatedAt"> | null {
  const name = String(body.name ?? "").trim();
  const awardTitle = String(body.awardTitle ?? "").trim();
  if (!name || !awardTitle) return null;

  const slug =
    String(body.slug ?? "").trim() ||
    slugifyHonoree(`${name}-${awardTitle}`) ||
    slugifyHonoree(name);

  return {
    name,
    awardTitle,
    graphicUrl: String(body.graphicUrl ?? "").trim(),
    accomplishments: String(body.accomplishments ?? "").trim(),
    pullQuote: String(body.pullQuote ?? "").trim(),
    slug,
    displayOrder: Number(body.displayOrder ?? 0),
    publishToMagazine: parseBoolean(body.publishToMagazine),
    status: parseOption(body.status, honoreeStatusOptions, "Draft"),
    createdByName: addedBy?.name ?? String(body.createdByName ?? "").trim(),
    createdByEmail: addedBy?.email ?? String(body.createdByEmail ?? "").trim(),
  };
}
