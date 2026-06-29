import { describe, expect, it } from "vitest";
import {
  slugifyTicketPartner,
  ticketPartnerTrackingPath,
  ticketmasterPartnerDestination,
} from "@/lib/ticket-partner/links";

describe("ticket partner links", () => {
  it("creates stable slugs from nominee names", () => {
    expect(slugifyTicketPartner("Justice Vaughn", "nom_123456_abcd12")).toBe("justice-vaughn-abcd12");
  });

  it("builds tracking paths", () => {
    expect(ticketPartnerTrackingPath("justice-vaughn-abcd12")).toBe("/go/tickets/justice-vaughn-abcd12");
  });

  it("adds partner attribution params to Ticketmaster URLs", () => {
    const url = ticketmasterPartnerDestination("justice-vaughn-abcd12");
    expect(url).toContain("utm_source=setva");
    expect(url).toContain("utm_medium=ticket_partner");
    expect(url).toContain("setva_ref=justice-vaughn-abcd12");
  });
});
