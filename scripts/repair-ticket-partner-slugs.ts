import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const APPLY = process.argv.includes("--apply");

async function main() {
  const { listNomineesWithTicketPartnerSlugs } = await import("../src/lib/nominees-store");
  const { listNominees } = await import("../src/lib/nominees-store");
  const { slugifyTicketPartner } = await import("../src/lib/ticket-partner/links");

  const before = await listNominees();
  const mismatches = before.filter((nominee) => {
    const slug = nominee.ticketPartnerSlug.trim();
    if (!slug) return false;
    const expected = slugifyTicketPartner(nominee.name, nominee.id);
    return slug.toLowerCase() !== expected.toLowerCase();
  });

  console.log(`Found ${mismatches.length} nominee slug mismatch(es).`);
  for (const nominee of mismatches) {
    const expected = slugifyTicketPartner(nominee.name, nominee.id);
    console.log(`  ${nominee.name}: ${nominee.ticketPartnerSlug} -> ${expected}`);
  }

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to persist fixes.");
    return;
  }

  await listNomineesWithTicketPartnerSlugs();

  const after = await listNominees();
  const remaining = after.filter((nominee) => {
    const slug = nominee.ticketPartnerSlug.trim();
    if (!slug) return false;
    const expected = slugifyTicketPartner(nominee.name, nominee.id);
    return slug.toLowerCase() !== expected.toLowerCase();
  });

  console.log(`\nRepaired. Remaining mismatches: ${remaining.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
