/**
 * Migrate existing HQ dev account into Supabase team storage, issue SETVA ID,
 * bump session version (force re-login), and email the member.
 *
 * Usage:
 *   npx tsx scripts/migrate-hq-team.ts
 *   npx tsx scripts/migrate-hq-team.ts --send-email
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { sendHQApprovalEmail } from "../src/lib/hq-team/email";
import { hashPassword } from "../src/lib/hq-team/password";
import { issueHQTeamMember } from "../src/lib/hq-team/store";
import { siteUrl } from "../src/lib/sponsor-deck";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local optional for local-only dev credentials
  }
}

loadEnvFile();

async function main() {
  const sendEmail = process.argv.includes("--send-email");
  const email = process.env.HEADQUARTERS_DEV_EMAIL?.trim() || "Justicevaughn7@gmail.com";
  const password = process.env.HEADQUARTERS_DEV_PASSWORD?.trim() || "Texas4855";
  const name = process.env.HEADQUARTERS_DEV_NAME?.trim() || "Justice Vaughn";
  const phone = process.env.HEADQUARTERS_DEV_PHONE?.trim() || "4093442349";

  const passwordHash = await hashPassword(password);
  const member = await issueHQTeamMember({
    name,
    email,
    phone,
    passwordHash,
    forceRelogin: true,
  });

  console.log(`Issued ${member.setvaId} for ${member.email} (session v${member.sessionVersion})`);

  if (sendEmail) {
    const activateUrl = `${siteUrl()}/headquarters/login`;
    await sendHQApprovalEmail({
      name: member.name,
      email: member.email,
      setvaId: member.setvaId,
      activateUrl,
      forceRelogin: true,
    });
    console.log("Force re-login email sent.");
  } else {
    console.log("Skipped email. Re-run with --send-email to notify the member.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
