/**
 * Add or update an HQ team member in Supabase.
 *
 *   npx tsx scripts/add-hq-team-member.ts --name "Jocelyn Vaughn" --email jocelyncavinessbrigman@gmail.com
 *   npx tsx scripts/add-hq-team-member.ts --name "..." --email "..." --password "..." --send-email
 */
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";
import { sendHQWelcomeEmail } from "../src/lib/hq-team/email";
import { hashPassword } from "../src/lib/hq-team/password";
import { getHQTeamMemberByEmail, registerHQTeamMember, updateHQTeamMemberPassword } from "../src/lib/hq-team/store";

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
    // optional
  }
}

function argValue(flag: string): string {
  const index = process.argv.indexOf(flag);
  if (index === -1) return "";
  return process.argv[index + 1]?.trim() ?? "";
}

loadEnvFile();

async function main() {
  const name = argValue("--name");
  const email = argValue("--email").toLowerCase();
  const phone = argValue("--phone");
  const sendEmail = process.argv.includes("--send-email");
  let password = argValue("--password");

  if (!name || !email) {
    console.error("Usage: --name \"Full Name\" --email user@example.com [--password ...] [--phone ...] [--send-email]");
    process.exit(1);
  }

  const existing = await getHQTeamMemberByEmail(email);
  if (!password) {
    password = `SETVA-${randomBytes(4).toString("hex")}`;
  }

  const passwordHash = await hashPassword(password);
  const member = existing?.status === "active"
    ? await updateHQTeamMemberPassword({ email, passwordHash })
    : await registerHQTeamMember({
        name,
        email,
        phone: phone || undefined,
        passwordHash,
      });

  console.log(`${existing ? "Updated" : "Registered"} ${member.setvaId} — ${member.name} <${member.email}>`);
  console.log(`Temporary password: ${password}`);
  console.log("Share this password securely with the team member so they can sign in at /headquarters/login");

  if (sendEmail) {
    await sendHQWelcomeEmail({
      name: member.name,
      email: member.email,
      setvaId: member.setvaId,
    });
    console.log("Welcome email sent.");
  } else {
    console.log("Skipped welcome email. Add --send-email to notify the member.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
