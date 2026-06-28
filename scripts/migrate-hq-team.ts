/**
 * Seed or update the primary HQ admin account in Supabase.
 *
 * Usage:
 *   npx tsx scripts/migrate-hq-team.ts
 *   npx tsx scripts/migrate-hq-team.ts --send-email
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  createFormSubmission,
  FORM_TYPES,
  updateFormSubmission,
} from "../src/lib/form-submissions";
import { sendHQWelcomeEmail } from "../src/lib/hq-team/email";
import { hashPassword } from "../src/lib/hq-team/password";
import { getHQTeamMemberByEmail, nextSetvaId } from "../src/lib/hq-team/store";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function memberExternalId(email: string): string {
  return `hq_member_${normalizeEmail(email)}`;
}

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
  const existing = await getHQTeamMemberByEmail(email);
  const now = new Date().toISOString();
  const member = {
    setvaId: existing?.setvaId || (await nextSetvaId()),
    name,
    email,
    phone: phone || existing?.phone || "",
    passwordHash,
    status: "active" as const,
    sessionVersion: (existing?.sessionVersion ?? 0) + 1,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const record = existing
    ? await updateFormSubmission(memberExternalId(email), FORM_TYPES.hqTeamMembers, {
        status: "active",
        contactEmail: email,
        contactName: name,
        payload: member,
      })
    : await createFormSubmission({
        externalId: memberExternalId(email),
        formType: FORM_TYPES.hqTeamMembers,
        status: "active",
        contactEmail: email,
        contactName: name,
        payload: member,
      });

  if (!record) throw new Error("Failed to save HQ team member.");

  console.log(`${existing ? "Updated" : "Registered"} ${member.setvaId} for ${member.email}`);

  if (sendEmail) {
    await sendHQWelcomeEmail({
      name: member.name,
      email: member.email,
      setvaId: member.setvaId,
    });
    console.log("Welcome email sent.");
  } else {
    console.log("Skipped email. Re-run with --send-email to notify the member.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
