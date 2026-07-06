/**
 * Remove test/demo form submissions from Supabase.
 *
 *   npx tsx scripts/purge-mock-submissions.ts          # dry run
 *   npx tsx scripts/purge-mock-submissions.ts --apply    # delete
 */
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env.local");
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
}

loadEnvFile();

async function main() {
  const apply = process.argv.includes("--apply");
  const { listAllFormSubmissions, deleteFormSubmissionById } = await import(
    "../src/lib/form-submissions"
  );
  const { isMockFormSubmission } = await import("../src/lib/mock-data");

  const records = await listAllFormSubmissions();
  const mockRecords = records.filter(isMockFormSubmission);

  if (mockRecords.length === 0) {
    console.log("No mock submissions found.");
    return;
  }

  console.log(`${apply ? "Deleting" : "Would delete"} ${mockRecords.length} mock submission(s):\n`);
  for (const record of mockRecords) {
    console.log(
      `  - ${record.form_type} | ${record.contact_name ?? "—"} | ${record.contact_email ?? "—"} | ${record.status}`,
    );
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to delete.");
    return;
  }

  let deleted = 0;
  for (const record of mockRecords) {
    await deleteFormSubmissionById(record.id);
    deleted += 1;
  }

  console.log(`\nDeleted ${deleted} mock submission(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
