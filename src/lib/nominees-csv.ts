import { resolveCategoryId } from "@/lib/nominee-categories-store";
import { type NomineeCategory, type NomineeData } from "@/lib/nominees";

export type NomineeCsvParseResult = {
  rows: NomineeData[];
  errors: string[];
};

const HEADER_ALIASES: Record<keyof NomineeData, string[]> = {
  name: ["name", "nominee", "nominee name", "full name"],
  categoryId: ["category", "category id", "categoryid", "award category", "nomination category"],
  cityRegion: ["city", "region", "city region", "city / region", "location", "hometown"],
  contactEmail: ["email", "contact email", "e-mail", "email address"],
  contactPhone: ["phone", "contact phone", "phone number", "mobile", "cell"],
  socialLinks: ["social", "social links", "social media", "social media links"],
  internalNotes: ["notes", "internal notes"],
  confirmationStatus: ["confirmation", "confirmation status", "status"],
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function mapHeader(header: string): keyof NomineeData | null {
  const normalized = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [keyof NomineeData, string[]][]) {
    if (aliases.includes(normalized)) return field;
  }
  return null;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseNomineeCsv(
  text: string,
  categories: NomineeCategory[],
): NomineeCsvParseResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: ["CSV file is empty."] };
  }

  const headerCells = parseCsvLine(lines[0]);
  const columnMap = new Map<number, keyof NomineeData>();

  headerCells.forEach((header, index) => {
    const field = mapHeader(header);
    if (field) columnMap.set(index, field);
  });

  if (![...columnMap.values()].includes("name")) {
    return { rows: [], errors: ["CSV must include a Name column."] };
  }
  if (![...columnMap.values()].includes("categoryId")) {
    return { rows: [], errors: ["CSV must include a Category column."] };
  }

  const rows: NomineeData[] = [];
  const errors: string[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const cells = parseCsvLine(lines[lineIndex]);
    if (cells.every((cell) => !cell)) continue;

    const row: Partial<Record<keyof NomineeData, string>> = {};
    columnMap.forEach((field, columnIndex) => {
      row[field] = cells[columnIndex] ?? "";
    });

    const name = String(row.name ?? "").trim();
    const categoryRaw = String(row.categoryId ?? "").trim();
    const categoryId = resolveCategoryId(categories, categoryRaw);

    if (!name) {
      errors.push(`Row ${lineIndex + 1}: missing name.`);
      continue;
    }
    if (!categoryId) {
      errors.push(`Row ${lineIndex + 1}: unknown category "${categoryRaw}".`);
      continue;
    }

    rows.push({
      name,
      categoryId,
      cityRegion: String(row.cityRegion ?? "").trim(),
      contactEmail: String(row.contactEmail ?? "").trim(),
      contactPhone: String(row.contactPhone ?? "").trim(),
      socialLinks: String(row.socialLinks ?? "")
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
      internalNotes: String(row.internalNotes ?? "").trim(),
      confirmationStatus: String(row.confirmationStatus ?? "Pending") as NomineeData["confirmationStatus"],
    });
  }

  return { rows, errors };
}

export const nomineeCsvTemplate = [
  "Name,Category,City / Region,Contact Email,Contact Phone,Social Media Links,Internal Notes,Confirmation Status",
  "Example Artist,Artist of the Year,Beaumont,artist@example.com,4095550100,https://instagram.com/example,Needs confirmation,Pending",
].join("\n");
