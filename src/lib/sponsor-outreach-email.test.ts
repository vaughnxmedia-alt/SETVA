import { describe, expect, it } from "vitest";

import {
  automatedPublicSponsorOutreachInput,
  buildSponsorOutreachEmailHtml,
  DEFAULT_SPONSOR_OUTREACH_COPY,
} from "./sponsor-outreach-email";
import { compilePublicSponsorPackagesEmail, compileSponsorOutreachEmail } from "./email";

describe("buildSponsorOutreachEmailHtml", () => {
  it("matches HQ all-packages default outreach email", () => {
    const lead = {
      name: "Alex Morgan",
      email: "alex@example.com",
      company: "Acme Health",
    };

    const publicEmail = compilePublicSponsorPackagesEmail(lead);
    const hqDefault = compileSponsorOutreachEmail(lead, {
      emailCopy: DEFAULT_SPONSOR_OUTREACH_COPY,
    });

    expect(publicEmail.subject).toBe(hqDefault.subject);
    expect(publicEmail.html).toBe(hqDefault.html);
    expect(publicEmail.linkUrl).toBe(hqDefault.linkUrl);
    expect(publicEmail.html).toContain("View all sponsor packages");
    expect(automatedPublicSponsorOutreachInput(lead).packageId).toBeUndefined();
  });

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
