import type { TicketPartnerLead } from "@/lib/ticket-partner/types";
import type { ImportableTicketPurchase, TicketPurchaseRecord } from "@/lib/ticket-partner/purchases-store";

/** Preferred seating regular price — used when Ticketmaster export has no amount. */
export const DEFAULT_TICKETMASTER_TICKET_AMOUNT = 30;

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
  email: [
    "email",
    "email address",
    "buyer email",
    "e-mail",
    "primary_em",
    "primary email",
    "primaryemail",
  ],
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
 *
 * Email-only exports (e.g. PRIMARY_EM) are valid: each row is 1 Preferred
 * ticket at {@link DEFAULT_TICKETMASTER_TICKET_AMOUNT} when quantity/amount
 * are missing.
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

  const hasAmountColumn = matchedColumns.includes("amount");
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

    const quantity = parseNumber(get("quantity")) || 1;
    const parsedAmount = parseNumber(get("amount"));
    const amount =
      hasAmountColumn && parsedAmount > 0
        ? parsedAmount
        : DEFAULT_TICKETMASTER_TICKET_AMOUNT * quantity;

    rows.push({
      buyerName: name,
      buyerEmail: email,
      buyerPhone: get("phone"),
      quantity,
      amount,
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
  /** True when the email/name appeared on more than one partner form; credited to earliest only. */
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
  /** Form emails for this partner that matched a purchase but were credited elsewhere. */
  uncreditedBuyers: MatchedBuyer[];
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

type LeadIndexEntry = {
  sourceId: string;
  sourceName: string;
  submittedAt: string;
};

/**
 * Among leads that share an email (or name), pick the earliest complete form's
 * source. Duplicate IDs with the same normalized name collapse to one credit.
 */
function pickCreditedSource(
  candidates: LeadIndexEntry[],
): { sourceId: string; ambiguous: boolean } | null {
  if (candidates.length === 0) return null;

  const bySourceId = new Map<string, LeadIndexEntry>();
  for (const entry of candidates) {
    const existing = bySourceId.get(entry.sourceId);
    if (!existing || new Date(entry.submittedAt).getTime() < new Date(existing.submittedAt).getTime()) {
      bySourceId.set(entry.sourceId, entry);
    }
  }

  const unique = [...bySourceId.values()];
  if (unique.length === 1) {
    return { sourceId: unique[0].sourceId, ambiguous: false };
  }

  // Same display name under different IDs → credit earliest, not ambiguous for payout.
  const byName = new Map<string, LeadIndexEntry[]>();
  for (const entry of unique) {
    const key = normalizeName(entry.sourceName) || entry.sourceId;
    const list = byName.get(key) ?? [];
    list.push(entry);
    byName.set(key, list);
  }

  const distinctNames = [...byName.keys()];
  const ambiguous = distinctNames.length > 1;

  const sorted = [...unique].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  );
  return { sourceId: sorted[0].sourceId, ambiguous };
}

/**
 * Matches imported buyers to captured leads (by email first, then name) and
 * attributes each buyer to one partner. When an email appears on multiple
 * partner forms, credit goes to the earliest complete form only.
 */
export function reconcilePurchases(
  leads: TicketPartnerLead[],
  purchases: TicketPurchaseRecord[],
): ReconciliationResult {
  const emailToLeads = new Map<string, LeadIndexEntry[]>();
  const nameToLeads = new Map<string, LeadIndexEntry[]>();

  for (const lead of leads) {
    const entry: LeadIndexEntry = {
      sourceId: lead.sourceId,
      sourceName: lead.sourceName,
      submittedAt: lead.submittedAt,
    };
    const email = normalizeEmail(lead.buyerEmail);
    const name = normalizeName(lead.buyerName);
    if (email) {
      const list = emailToLeads.get(email) ?? [];
      list.push(entry);
      emailToLeads.set(email, list);
    }
    if (name) {
      const list = nameToLeads.get(name) ?? [];
      list.push(entry);
      nameToLeads.set(name, list);
    }
  }

  const bySourceId = new Map<string, SourceReconciliation>();
  const ensureSource = (sourceId: string): SourceReconciliation => {
    let entry = bySourceId.get(sourceId);
    if (!entry) {
      entry = {
        sourceId,
        matchedBuyers: [],
        uncreditedBuyers: [],
        ticketsSold: 0,
        salesAmount: 0,
      };
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

    let candidates = email ? emailToLeads.get(email) : undefined;
    let matchType: "email" | "name" = "email";
    if (!candidates || candidates.length === 0) {
      candidates = name ? nameToLeads.get(name) : undefined;
      matchType = "name";
    }

    if (!candidates || candidates.length === 0) {
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

    const pick = pickCreditedSource(candidates);
    if (!pick) {
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

    matchedCount += 1;
    ticketsSold += purchase.quantity;
    salesAmount += purchase.amount;

    const buyerBase = {
      purchaseId: purchase.id,
      buyerName: purchase.buyerName,
      buyerEmail: purchase.buyerEmail,
      buyerPhone: purchase.buyerPhone,
      quantity: purchase.quantity,
      amount: purchase.amount,
      orderRef: purchase.orderRef,
      matchType,
      ambiguous: pick.ambiguous,
    };

    const credited = ensureSource(pick.sourceId);
    credited.matchedBuyers.push(buyerBase);
    credited.ticketsSold += purchase.quantity;
    credited.salesAmount += purchase.amount;

    // Other partners who also captured this email see it as uncredited.
    const otherSourceIds = new Set(
      candidates.map((c) => c.sourceId).filter((id) => id !== pick.sourceId),
    );
    for (const sourceId of otherSourceIds) {
      ensureSource(sourceId).uncreditedBuyers.push(buyerBase);
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
