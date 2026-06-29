import { randomBytes } from "crypto";
import {
  createFormSubmission,
  FORM_TYPES,
  formStorageMode,
  listFormSubmissions,
  type FormSubmissionRecord,
} from "@/lib/form-submissions";
import type { TicketPartnerLead, TicketPartnerSource } from "@/lib/ticket-partner/types";

type TicketPartnerLeadPayload = {
  buyerName: string;
  slug: string;
  sourceType: TicketPartnerSource;
  sourceId: string;
  sourceName: string;
  partnerCategory: string;
};

function createLeadId(): string {
  return `tpl_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function leadFromRecord(record: FormSubmissionRecord): TicketPartnerLead {
  const payload = record.payload as TicketPartnerLeadPayload;
  return {
    id: record.external_id ?? record.id,
    buyerName: payload.buyerName,
    slug: payload.slug,
    sourceType: payload.sourceType,
    sourceId: payload.sourceId,
    sourceName: payload.sourceName,
    partnerCategory: payload.partnerCategory,
    submittedAt: record.submitted_at,
  };
}

export async function saveTicketPartnerLead(input: {
  buyerName: string;
  slug: string;
  sourceType: TicketPartnerSource;
  sourceId: string;
  sourceName: string;
  partnerCategory: string;
}): Promise<TicketPartnerLead | null> {
  if (formStorageMode() !== "supabase") return null;

  const buyerName = input.buyerName.trim().slice(0, 120);
  if (!buyerName) return null;

  const id = createLeadId();
  const payload: TicketPartnerLeadPayload = {
    buyerName,
    slug: input.slug,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    sourceName: input.sourceName,
    partnerCategory: input.partnerCategory,
  };

  const record = await createFormSubmission({
    externalId: id,
    formType: FORM_TYPES.ticketPartnerLeads,
    status: "captured",
    contactName: buyerName,
    payload,
  });

  return record ? leadFromRecord(record) : null;
}

export async function listTicketPartnerLeads(): Promise<TicketPartnerLead[]> {
  if (formStorageMode() !== "supabase") return [];
  const records = await listFormSubmissions(FORM_TYPES.ticketPartnerLeads);
  return records
    .map(leadFromRecord)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function getTicketPartnerLead(id: string): Promise<TicketPartnerLead | null> {
  if (formStorageMode() !== "supabase") return null;
  const records = await listFormSubmissions(FORM_TYPES.ticketPartnerLeads);
  return records.map(leadFromRecord).find((lead) => lead.id === id) ?? null;
}
