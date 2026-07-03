import { randomBytes } from "crypto";
import {
  createFormSubmission,
  deleteFormSubmission,
  FORM_TYPES,
  formStorageMode,
  listFormSubmissions,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";

/** A buyer row imported from a Ticketmaster sales export. */
export type TicketPurchaseRecord = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  quantity: number;
  amount: number;
  orderRef: string;
  importBatchId: string;
  importedAt: string;
};

type TicketPurchasePayload = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  quantity: number;
  amount: number;
  orderRef: string;
  importBatchId: string;
};

export type ImportableTicketPurchase = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  quantity: number;
  amount: number;
  orderRef: string;
};

function createPurchaseId(): string {
  return `tps_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

export function createImportBatchId(): string {
  return `tpb_${Date.now()}_${randomBytes(3).toString("hex")}`;
}

function purchaseFromRecord(record: FormSubmissionRecord): TicketPurchaseRecord {
  const payload = record.payload as TicketPurchasePayload;
  return {
    id: record.external_id ?? record.id,
    buyerName: payload.buyerName ?? "",
    buyerEmail: payload.buyerEmail ?? "",
    buyerPhone: payload.buyerPhone ?? "",
    quantity: Number(payload.quantity ?? 0),
    amount: Number(payload.amount ?? 0),
    orderRef: payload.orderRef ?? "",
    importBatchId: payload.importBatchId ?? "",
    importedAt: record.submitted_at,
  };
}

/** Persists a batch of imported buyers. Returns how many were stored. */
export async function saveTicketPurchases(
  rows: ImportableTicketPurchase[],
  importBatchId: string,
): Promise<number> {
  if (formStorageMode() !== "supabase") return 0;

  let saved = 0;
  for (const row of rows) {
    const buyerName = row.buyerName.trim().slice(0, 160);
    const buyerEmail = row.buyerEmail.trim().toLowerCase().slice(0, 254);
    if (!buyerName && !buyerEmail) continue;

    const payload: TicketPurchasePayload = {
      buyerName,
      buyerEmail,
      buyerPhone: row.buyerPhone.trim().slice(0, 40),
      quantity: Number.isFinite(row.quantity) && row.quantity > 0 ? Math.round(row.quantity) : 1,
      amount: Number.isFinite(row.amount) && row.amount > 0 ? row.amount : 0,
      orderRef: row.orderRef.trim().slice(0, 120),
      importBatchId,
    };

    const record = await createFormSubmission({
      externalId: createPurchaseId(),
      formType: FORM_TYPES.ticketPurchases,
      status: "imported",
      contactName: buyerName,
      contactEmail: buyerEmail || undefined,
      payload,
    });
    if (record) saved += 1;
  }
  return saved;
}

export async function listTicketPurchases(): Promise<TicketPurchaseRecord[]> {
  if (formStorageMode() !== "supabase") return [];
  const records = await listFormSubmissions(FORM_TYPES.ticketPurchases);
  return records
    .map(purchaseFromRecord)
    .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
}

/** Removes all imported purchases (optionally only one batch). Returns count removed. */
export async function clearTicketPurchases(importBatchId?: string): Promise<number> {
  if (formStorageMode() !== "supabase") return 0;
  const purchases = await listTicketPurchases();
  const targets = importBatchId
    ? purchases.filter((p) => p.importBatchId === importBatchId)
    : purchases;

  let removed = 0;
  for (const purchase of targets) {
    const ok = await deleteFormSubmission(purchase.id, FORM_TYPES.ticketPurchases);
    if (ok) removed += 1;
  }
  return removed;
}
