import { describe, expect, it } from "vitest";
import {
  slugifyTicketPartner,
  ticketPartnerTrackingPath,
  ticketmasterDestination,
} from "@/lib/ticket-partner/links";

describe("ticket partner links", () => {
  it("creates stable slugs from nominee names", () => {
    expect(slugifyTicketPartner("Justice Vaughn", "nom_123456_abcd12")).toBe("justice-vaughn-abcd12");
  });

  it("builds tracking paths", () => {
    expect(ticketPartnerTrackingPath("justice-vaughn-abcd12")).toBe("/go/tickets/justice-vaughn-abcd12");
  });

  it("sends buyers to Ticketmaster", () => {
    expect(ticketmasterDestination()).toContain("ticketmaster.com");
  });

  it("keeps the destination free of tracking params that trip bot checks", () => {
    const url = ticketmasterDestination();
    expect(url).not.toContain("?");
    expect(url).not.toContain("utm_");
    expect(url).not.toContain("setva_ref");
  });
});
