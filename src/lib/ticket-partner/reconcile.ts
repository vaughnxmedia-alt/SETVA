import type { TicketPartnerLead } from "@/lib/ticket-partner/types";
import type { ImportableTicketPurchase, TicketPurchaseRecord } from "@/lib/ticket-partner/purchases-store";

/** Normalizes an email for comparison (trim + lowercase). */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Normalizes a person's name for comparison (lowercase, collapse spaces, strip punctuation). */
export function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,'"]/g, "")
    .replace(/\s+/g, " ");
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

/** Splits a single CSV/TSV line into fields, honoring double-quoted values. */
function splitDelimited(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((field) => field.trim());
}

function detectDelimiter(headerLine: string): string {
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return tabs > commas ? "\t" : ",";
}

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "buyer", "buyer name", "customer", "customer name", "full name", "attendee"],
  firstName: ["first name", "firstname", "first"],
  lastName: ["last name", "lastname", "last"],
  email: ["email", "email address", "buyer email", "e-mail"],
  phone: ["phone", "phone number", "mobile", "cell", "telephone"],
  quantity: ["quantity", "qty", "tickets", "# of tickets", "num tickets", "ticket count", "seats"],
  amount: ["amount", "total", "order total", "total paid", "price", "grand total", "revenue"],
  orderRef: ["order", "order #", "order id", "order number", "confirmation", "confirmation #", "reference", "ref"],
};

function matchHeader(header: string): string | null {
  const normalized = header.trim().toLowerCase();
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(normalized)) return key;
  }
  return null;
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export type ParseTicketmasterResult = {
  rows: ImportableTicketPurchase[];
  skipped: number;
  columns: string[];
  error?: string;
};

/**
 * Parses a pasted Ticketmaster export (CSV or TSV, with a header row) into
 * importable buyer rows. Column names are matched flexibly.
 */
export function parseTicketmasterExport(raw: string): ParseTicketmasterResult {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!text) {
    return { rows: [], skipped: 0, columns: [], error: "Paste the Ticketmaster export first." };
  }

  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], skipped: 0, columns: [], error: "Include a header row and at least one buyer." };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitDelimited(lines[0], delimiter);
  const columnMap = headers.map(matchHeader);
  const matchedColumns = columnMap.filter((c): c is string => c !== null);

  if (!matchedColumns.includes("email") && !matchedColumns.includes("name") && !matchedColumns.includes("lastName")) {
    return {
      rows: [],
      skipped: 0,
      columns: matchedColumns,
      error: "Could not find a name or email column in the header row.",
    };
  }

  const rows: ImportableTicketPurchase[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const fields = splitDelimited(lines[i], delimiter);
    const get = (key: string): string => {
      const index = columnMap.indexOf(key);
      return index >= 0 ? fields[index] ?? "" : "";
    };

    let name = get("name");
    if (!name) {
      name = [get("firstName"), get("lastName")].filter(Boolean).join(" ").trim();
    }
    const email = get("email");
    if (!name && !email) {
      skipped += 1;
      continue;
    }

    rows.push({
      buyerName: name,
      buyerEmail: email,
      buyerPhone: get("phone"),
      quantity: parseNumber(get("quantity")) || 1,
      amount: parseNumber(get("amount")),
      orderRef: get("orderRef"),
    });
  }

  return { rows, skipped, columns: matchedColumns };
}

// ---------------------------------------------------------------------------
// Matching / reconciliation
// ---------------------------------------------------------------------------

export type MatchedBuyer = {
  purchaseId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  quantity: number;
  amount: number;
  orderRef: string;
  matchType: "email" | "name";
  ambiguous: boolean;
};

export type UnmatchedBuyer = {
  purchaseId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  quantity: number;
  amount: number;
  orderRef: string;
};

export type SourceReconciliation = {
  sourceId: string;
  matchedBuyers: MatchedBuyer[];
  ticketsSold: number;
  salesAmount: number;
};

export type ReconciliationResult = {
  bySourceId: Map<string, SourceReconciliation>;
  unmatchedBuyers: UnmatchedBuyer[];
  totals: {
    importedBuyers: number;
    matchedBuyers: number;
    ticketsSold: number;
    salesAmount: number;
  };
};

/**
 * Matches imported buyers to captured leads (by email first, then name) and
 * attributes each buyer to the nominee/ambassador whose lead they match. A
 * buyer that matches leads for more than one source is flagged ambiguous and
 * counted for each matched source.
 */
export function reconcilePurchases(
  leads: TicketPartnerLead[],
  purchases: TicketPurchaseRecord[],
): ReconciliationResult {
  const emailToSources = new Map<string, Set<string>>();
  const nameToSources = new Map<string, Set<string>>();

  for (const lead of leads) {
    const email = normalizeEmail(lead.buyerEmail);
    const name = normalizeName(lead.buyerName);
    if (email) {
      if (!emailToSources.has(email)) emailToSources.set(email, new Set());
      emailToSources.get(email)!.add(lead.sourceId);
    }
    if (name) {
      if (!nameToSources.has(name)) nameToSources.set(name, new Set());
      nameToSources.get(name)!.add(lead.sourceId);
    }
  }

  const bySourceId = new Map<string, SourceReconciliation>();
  const ensureSource = (sourceId: string): SourceReconciliation => {
    let entry = bySourceId.get(sourceId);
    if (!entry) {
      entry = { sourceId, matchedBuyers: [], ticketsSold: 0, salesAmount: 0 };
      bySourceId.set(sourceId, entry);
    }
    return entry;
  };

  const unmatchedBuyers: UnmatchedBuyer[] = [];
  let matchedCount = 0;
  let ticketsSold = 0;
  let salesAmount = 0;

  for (const purchase of purchases) {
    const email = normalizeEmail(purchase.buyerEmail);
    const name = normalizeName(purchase.buyerName);

    let sourceIds = email ? emailToSources.get(email) : undefined;
    let matchType: "email" | "name" = "email";
    if (!sourceIds || sourceIds.size === 0) {
      sourceIds = name ? nameToSources.get(name) : undefined;
      matchType = "name";
    }

    if (!sourceIds || sourceIds.size === 0) {
      unmatchedBuyers.push({
        purchaseId: purchase.id,
        buyerName: purchase.buyerName,
        buyerEmail: purchase.buyerEmail,
        buyerPhone: purchase.buyerPhone,
        quantity: purchase.quantity,
        amount: purchase.amount,
        orderRef: purchase.orderRef,
      });
      continue;
    }

    const ambiguous = sourceIds.size > 1;
    matchedCount += 1;
    ticketsSold += purchase.quantity;
    salesAmount += purchase.amount;

    for (const sourceId of sourceIds) {
      const entry = ensureSource(sourceId);
      entry.matchedBuyers.push({
        purchaseId: purchase.id,
        buyerName: purchase.buyerName,
        buyerEmail: purchase.buyerEmail,
        buyerPhone: purchase.buyerPhone,
        quantity: purchase.quantity,
        amount: purchase.amount,
        orderRef: purchase.orderRef,
        matchType,
        ambiguous,
      });
      entry.ticketsSold += purchase.quantity;
      entry.salesAmount += purchase.amount;
    }
  }

  return {
    bySourceId,
    unmatchedBuyers,
    totals: {
      importedBuyers: purchases.length,
      matchedBuyers: matchedCount,
      ticketsSold,
      salesAmount,
    },
  };
}
