import { FORM_TYPES, listFormSubmissions, type FormSubmissionRecord } from "@/lib/form-submissions";
import { isMockFormSubmission } from "@/lib/mock-data";
import {
  PAY_BY_CHECK_OR_MONEY_ORDER,
  PAY_BY_CHECK_OR_MONEY_ORDER_MEETING,
  type SponsorIntakeData,
} from "@/lib/sponsor-intake";

export type SponsorBuyerRecord = {
  id: string;
  packageId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  jobTitle: string;
  website: string;
  industry: string;
  preferredPayment: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  submittedAt: string;
  source: "confirmed" | "intake";
};

function intakeFromRecord(record: FormSubmissionRecord): SponsorIntakeData | null {
  const payload = record.payload as Partial<SponsorIntakeData>;
  if (!payload.packageId || !payload.companyName || !payload.contactName || !payload.email) {
    return null;
  }
  return payload as SponsorIntakeData;
}

function paymentStatusForRecord(record: FormSubmissionRecord): string {
  if (record.form_type === FORM_TYPES.sponsorCheckoutConfirmed) {
    return "Paid in full";
  }

  const intake = intakeFromRecord(record);
  if (!intake) return record.status;

  if (record.status === "offline_pending") {
    if (intake.preferredPayment === PAY_BY_CHECK_OR_MONEY_ORDER_MEETING) {
      return "Check pending — meeting scheduled";
    }
    if (intake.preferredPayment === PAY_BY_CHECK_OR_MONEY_ORDER) {
      return "Check pending";
    }
    return "Offline payment pending";
  }

  if (record.status === "checkout_pending") {
    return "Payment outstanding";
  }

  return record.status.replaceAll("_", " ");
}

function fulfillmentStatusForPayment(paymentStatus: string): string {
  if (paymentStatus === "Paid in full") return "Awaiting assets";
  if (paymentStatus.includes("Check pending")) return "Awaiting payment";
  if (paymentStatus === "Payment outstanding") return "Checkout in progress";
  return "In pipeline";
}

function buyerFromRecord(
  record: FormSubmissionRecord,
  source: SponsorBuyerRecord["source"],
): SponsorBuyerRecord | null {
  const intake = intakeFromRecord(record);
  if (!intake) return null;

  const paymentStatus = paymentStatusForRecord(record);

  return {
    id: record.external_id ?? record.id,
    packageId: intake.packageId,
    companyName: intake.companyName,
    contactName: intake.contactName,
    email: intake.email,
    phone: intake.phone ?? "",
    jobTitle: intake.jobTitle ?? "",
    website: intake.website ?? "",
    industry: intake.industry ?? "",
    preferredPayment: intake.preferredPayment ?? "",
    paymentStatus,
    fulfillmentStatus: fulfillmentStatusForPayment(paymentStatus),
    submittedAt: record.submitted_at,
    source,
  };
}

export async function listSponsorBuyerRecords(): Promise<SponsorBuyerRecord[]> {
  const [intakes, confirmed] = await Promise.all([
    listFormSubmissions(FORM_TYPES.sponsorIntake),
    listFormSubmissions(FORM_TYPES.sponsorCheckoutConfirmed),
  ]);

  const buyers: SponsorBuyerRecord[] = [];
  const confirmedKeys = new Set<string>();

  for (const record of confirmed.filter((row) => !isMockFormSubmission(row))) {
    const buyer = buyerFromRecord(record, "confirmed");
    if (!buyer) continue;
    buyers.push(buyer);
    confirmedKeys.add(`${buyer.email.toLowerCase()}:${buyer.packageId}`);
  }

  for (const record of intakes.filter((row) => !isMockFormSubmission(row))) {
    const buyer = buyerFromRecord(record, "intake");
    if (!buyer) continue;
    const key = `${buyer.email.toLowerCase()}:${buyer.packageId}`;
    if (confirmedKeys.has(key)) continue;
    buyers.push(buyer);
  }

  return buyers.sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

export function countBuyersByPackage(
  buyers: SponsorBuyerRecord[],
  filter?: (buyer: SponsorBuyerRecord) => boolean,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const buyer of buyers) {
    if (filter && !filter(buyer)) continue;
    counts[buyer.packageId] = (counts[buyer.packageId] ?? 0) + 1;
  }
  return counts;
}
