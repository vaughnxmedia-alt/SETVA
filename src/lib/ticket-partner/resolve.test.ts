import { describe, expect, it } from "vitest";
import {
  ensureAmbassadorTicketPartnerSlug,
  ensureNomineeTicketPartnerSlug,
} from "@/lib/ticket-partner/resolve";

describe("ticket partner slug resolution", () => {
  it("returns canonical nominee slug when stored slug belongs to another person", async () => {
    const slug = await ensureNomineeTicketPartnerSlug({
      id: "nom_1782898632317_97773658",
      name: "Kirby Bruff",
      ticketPartnerSlug: "chino-grind-773658",
    });
    expect(slug).toBe("kirby-bruff-773658");
  });

  it("keeps stored nominee slug when it already matches canonical form", async () => {
    const slug = await ensureNomineeTicketPartnerSlug({
      id: "nom_1782899026838_ccb9b319",
      name: "Kirby Bruff",
      ticketPartnerSlug: "kirby-bruff-b9b319",
    });
    expect(slug).toBe("kirby-bruff-b9b319");
  });

  it("returns canonical ambassador slug when stored slug is stale", async () => {
    const slug = await ensureAmbassadorTicketPartnerSlug({
      id: "amb_123456_abcd12",
      fullName: "Justice Vaughn",
      ticketPartnerSlug: "old-name-abcd12",
    });
    expect(slug).toBe("justice-vaughn-abcd12");
  });
});
