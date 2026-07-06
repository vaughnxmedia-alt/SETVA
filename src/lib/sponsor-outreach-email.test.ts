import { describe, expect, it } from "vitest";

import { buildSponsorOutreachEmailHtml } from "./sponsor-outreach-email";

describe("buildSponsorOutreachEmailHtml", () => {
  it("linkifies www URLs with paths without corrupting anchor HTML", () => {
    const html = buildSponsorOutreachEmailHtml({
      lead: { name: "Justice", email: "justice@example.com" },
      emailCopy:
        "You can view our sponsorship opportunities here:\nwww.setvawards.com/sponsors",
    });

    expect(html).toContain('href="https://www.setvawards.com/sponsors"');
    expect(html).toContain("www.setvawards.com/sponsors</a>");
    expect(html).not.toContain('https://setvawards.com" style');
  });

  it("linkifies signature emails and bare setvawards.com links", () => {
    const html = buildSponsorOutreachEmailHtml({
      lead: { name: "Justice", email: "justice@example.com" },
      emailCopy:
        "Best,\nJocelyn Vaughn\ncontactus@setvawards.com\nwww.setvawards.com",
    });

    expect(html).toContain('href="mailto:contactus@setvawards.com"');
    expect(html).toContain('href="https://www.setvawards.com"');
    expect(html).not.toContain('https://setvawards.com" style');
  });
});
