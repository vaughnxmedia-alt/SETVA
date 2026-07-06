import { describe, expect, it } from "vitest";

import { compileMediaCredentialApprovalConfirmationEmail } from "./media-credential-approval-email";
import { mediaCredentialTeamMemberWarning } from "./media-credential-team";

const sampleApplication = {
  id: "mc_test_123",
  fullName: "Jordan Lee",
  email: "jordan@media.com",
  mediaOutlet: "Beaumont News",
  teamMemberRoster: [{ name: "Alex Rivera" }, { name: "Sam Ortiz" }],
};

describe("compileMediaCredentialApprovalConfirmationEmail", () => {
  it("uses the fixed approval template with applicant-specific fields", () => {
    const compiled = compileMediaCredentialApprovalConfirmationEmail({
      application: sampleApplication,
      checkInTime: "3:00 PM",
      checkInLocation: "Jefferson Theatre — front entrance",
    });

    expect(compiled.plainText).toContain("Hello Jordan,");
    expect(compiled.plainText).toContain(
      "approved media access is limited to Outside Activities and the Lobby unless otherwise authorized by SETVA Media Relations",
    );
    expect(compiled.plainText).toContain("Media Check-In Time: 3:00 PM");
    expect(compiled.plainText).toContain(
      "Media Check-In Location: Jefferson Theatre — front entrance",
    );
    expect(compiled.plainText).toContain(mediaCredentialTeamMemberWarning);
    expect(compiled.plainText).toContain("/media-credentials/team?");
    expect(compiled.plainText).toContain("Alex Rivera");
    expect(compiled.html).toContain("Hello Jordan,");
    expect(compiled.subject).toContain("Media Credential Approved");
  });

  it("defaults check-in time when not provided", () => {
    const compiled = compileMediaCredentialApprovalConfirmationEmail({
      application: sampleApplication,
      checkInTime: "",
      checkInLocation: "Jefferson Theatre — front entrance",
    });

    expect(compiled.plainText).toContain("Media Check-In Time: Begins at 3:30 pm");
  });
});
