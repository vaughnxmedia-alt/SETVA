import { describe, expect, it } from "vitest";
import type { TicketPartnerLead } from "@/lib/ticket-partner/types";
import type { TicketPurchaseRecord } from "@/lib/ticket-partner/purchases-store";
import {
  DEFAULT_TICKETMASTER_TICKET_AMOUNT,
  parseTicketmasterExport,
  reconcilePurchases,
} from "@/lib/ticket-partner/reconcile";

function lead(
  partial: Partial<TicketPartnerLead> &
    Pick<TicketPartnerLead, "id" | "buyerEmail" | "sourceId" | "sourceName" | "submittedAt">,
): TicketPartnerLead {
  return {
    buyerName: partial.buyerName ?? "Buyer",
    buyerPhone: partial.buyerPhone ?? "4095550000",
    slug: partial.slug ?? "slug",
    sourceType: partial.sourceType ?? "nominee",
    partnerCategory: partial.partnerCategory ?? "Music",
    ...partial,
  };
}

function purchase(
  partial: Partial<TicketPurchaseRecord> & Pick<TicketPurchaseRecord, "id" | "buyerEmail">,
): TicketPurchaseRecord {
  return {
    buyerName: partial.buyerName ?? "",
    buyerPhone: partial.buyerPhone ?? "",
    quantity: partial.quantity ?? 1,
    amount: partial.amount ?? DEFAULT_TICKETMASTER_TICKET_AMOUNT,
    orderRef: partial.orderRef ?? "",
    importBatchId: partial.importBatchId ?? "batch",
    importedAt: partial.importedAt ?? "2026-08-08T12:00:00.000Z",
    ...partial,
  };
}

describe("parseTicketmasterExport", () => {
  it("accepts an email-only PRIMARY_EM export with $30 defaults", () => {
    const result = parseTicketmasterExport(
      ["PRIMARY_EM", "a@example.com", "b@example.com", "a@example.com"].join("\n"),
    );
    expect(result.error).toBeUndefined();
    expect(result.columns).toEqual(["email"]);
    expect(result.rows).toHaveLength(3);
    expect(result.rows.every((row) => row.quantity === 1)).toBe(true);
    expect(result.rows.every((row) => row.amount === DEFAULT_TICKETMASTER_TICKET_AMOUNT)).toBe(
      true,
    );
    expect(result.rows.filter((row) => row.buyerEmail === "a@example.com")).toHaveLength(2);
  });

  it("keeps explicit amount when the amount column is present", () => {
    const result = parseTicketmasterExport(
      ["email,quantity,amount", "a@example.com,2,100"].join("\n"),
    );
    expect(result.rows).toEqual([
      {
        buyerName: "",
        buyerEmail: "a@example.com",
        buyerPhone: "",
        quantity: 2,
        amount: 100,
        orderRef: "",
      },
    ]);
  });
});

describe("reconcilePurchases", () => {
  it("credits the earliest complete form when one email hits two partners", () => {
    const leads = [
      lead({
        id: "l1",
        buyerEmail: "shared@example.com",
        buyerName: "Shared Buyer",
        sourceId: "later-partner",
        sourceName: "Later Partner",
        submittedAt: "2026-07-02T12:00:00.000Z",
      }),
      lead({
        id: "l2",
        buyerEmail: "shared@example.com",
        buyerName: "Shared Buyer",
        sourceId: "earlier-partner",
        sourceName: "Earlier Partner",
        submittedAt: "2026-07-01T12:00:00.000Z",
      }),
    ];
    const purchases = [
      purchase({ id: "p1", buyerEmail: "shared@example.com", quantity: 1, amount: 30 }),
    ];

    const result = reconcilePurchases(leads, purchases);
    const credited = result.bySourceId.get("earlier-partner");
    const other = result.bySourceId.get("later-partner");

    expect(credited?.ticketsSold).toBe(1);
    expect(credited?.salesAmount).toBe(30);
    expect(credited?.matchedBuyers).toHaveLength(1);
    expect(credited?.matchedBuyers[0].ambiguous).toBe(true);
    expect(other?.matchedBuyers).toHaveLength(0);
    expect(other?.uncreditedBuyers).toHaveLength(1);
    expect(result.totals.ticketsSold).toBe(1);
  });

  it("counts duplicate Ticketmaster email rows as extra tickets for one partner", () => {
    const leads = [
      lead({
        id: "l1",
        buyerEmail: "dup@example.com",
        sourceId: "partner-a",
        sourceName: "Partner A",
        submittedAt: "2026-07-01T12:00:00.000Z",
      }),
    ];
    const purchases = [
      purchase({ id: "p1", buyerEmail: "dup@example.com" }),
      purchase({ id: "p2", buyerEmail: "dup@example.com" }),
      purchase({ id: "p3", buyerEmail: "dup@example.com" }),
    ];

    const result = reconcilePurchases(leads, purchases);
    const entry = result.bySourceId.get("partner-a");
    expect(entry?.ticketsSold).toBe(3);
    expect(entry?.salesAmount).toBe(90);
    expect(entry?.matchedBuyers).toHaveLength(3);
  });

  it("credits one ID only when the same name has duplicate source ids", () => {
    const leads = [
      lead({
        id: "l1",
        buyerEmail: "same@example.com",
        sourceId: "id-a",
        sourceName: "Cicely Sterling Moore",
        submittedAt: "2026-07-02T12:00:00.000Z",
      }),
      lead({
        id: "l2",
        buyerEmail: "same@example.com",
        sourceId: "id-b",
        sourceName: "Cicely Sterling Moore",
        submittedAt: "2026-07-01T12:00:00.000Z",
      }),
    ];
    const purchases = [purchase({ id: "p1", buyerEmail: "same@example.com" })];
    const result = reconcilePurchases(leads, purchases);

    expect(result.bySourceId.get("id-b")?.matchedBuyers).toHaveLength(1);
    expect(result.bySourceId.get("id-b")?.matchedBuyers[0].ambiguous).toBe(false);
    expect(result.bySourceId.get("id-a")?.uncreditedBuyers).toHaveLength(1);
    expect(result.totals.ticketsSold).toBe(1);
  });
});
