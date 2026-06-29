import { describe, expect, it } from "vitest";
import { parseTicketPartnerLeadInput } from "./parse-lead";

describe("parseTicketPartnerLeadInput", () => {
  it("accepts name, email, and phone", () => {
    const result = parseTicketPartnerLeadInput({
      buyerName: "Jane Doe",
      buyerEmail: "jane@example.com",
      buyerPhone: "4095551234",
    });
    expect(result).toEqual({
      data: {
        buyerName: "Jane Doe",
        buyerEmail: "jane@example.com",
        buyerPhone: "4095551234",
      },
    });
  });

  it("requires all fields", () => {
    expect(parseTicketPartnerLeadInput({ buyerEmail: "a@b.com", buyerPhone: "123" })).toEqual({
      error: "Please enter your name.",
    });
    expect(parseTicketPartnerLeadInput({ buyerName: "Jane", buyerPhone: "123" })).toEqual({
      error: "A valid email address is required.",
    });
    expect(parseTicketPartnerLeadInput({ buyerName: "Jane", buyerEmail: "jane@example.com" })).toEqual({
      error: "Phone number is required.",
    });
  });
});
