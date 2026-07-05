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

async function main() {
  const { listNominees } = await import("../src/lib/nominees-store");
  const { listNomineePageEntries } = await import("../src/lib/nominee-workflows-store");
  const { slugifyTicketPartner } = await import("../src/lib/ticket-partner/links");
  const { resolveTicketPartnerBySlug } = await import("../src/lib/ticket-partner/resolve");
  const { categoryTitleById, listNomineeCategories } = await import(
    "../src/lib/nominee-categories-store"
  );

  const nominees = await listNominees();
  const entries = await listNomineePageEntries();
  const categories = await listNomineeCategories();
  const byId = new Map(nominees.map((n) => [n.id, n]));

  console.log("=== SLUG AUDIT ===");
  const slugOwners = new Map<string, string[]>();
  for (const n of nominees) {
    const slug = n.ticketPartnerSlug.trim();
    if (!slug) continue;
    const list = slugOwners.get(slug.toLowerCase()) ?? [];
    list.push(`${n.name} (${n.id})`);
    slugOwners.set(slug.toLowerCase(), list);
  }

  const dups = [...slugOwners.entries()].filter(([, v]) => v.length > 1);
  console.log("Duplicate slugs:", dups.length);
  for (const [slug, owners] of dups) {
    console.log(" ", slug, "->", owners.join(" | "));
  }

  const mismatches: {
    name: string;
    id: string;
    stored: string;
    expected: string;
  }[] = [];
  for (const n of nominees) {
    const slug = n.ticketPartnerSlug.trim();
    if (!slug) continue;
    const expected = slugifyTicketPartner(n.name, n.id);
    if (slug.toLowerCase() !== expected.toLowerCase()) {
      mismatches.push({ name: n.name, id: n.id, stored: slug, expected });
    }
  }
  console.log("Slug/name mismatches:", mismatches.length);
  for (const m of mismatches) {
    console.log(" ", m.name, "stored=", m.stored, "expected=", m.expected);
  }

  console.log("\n=== RESOLVE CHECK ===");
  let resolveFails = 0;
  for (const n of nominees.filter((x) => x.ticketPartnerSlug.trim())) {
    const resolved = await resolveTicketPartnerBySlug(n.ticketPartnerSlug);
    if (!resolved || resolved.sourceId !== n.id) {
      resolveFails += 1;
      console.log(
        "RESOLVE FAIL:",
        n.name,
        n.id,
        "slug",
        n.ticketPartnerSlug,
        "->",
        resolved?.sourceName,
        resolved?.sourceId,
      );
    }
  }
  console.log("Resolve failures:", resolveFails);

  console.log("\n=== PAGE ENTRY CHECK (published) ===");
  const published = entries.filter((e) => e.publishToNomineePage && e.status === "Published");
  let entryIssues = 0;
  for (const e of published) {
    const nom = byId.get(e.nomineeId);
    if (!nom) {
      console.log("Missing nominee for entry", e.id, e.nomineeId);
      entryIssues += 1;
      continue;
    }
    const resolved = nom.ticketPartnerSlug
      ? await resolveTicketPartnerBySlug(nom.ticketPartnerSlug)
      : null;
    if (resolved && resolved.sourceId !== nom.id) {
      console.log("Entry nominee resolves wrong:", nom.name, "->", resolved.sourceName);
      entryIssues += 1;
    }
  }
  console.log("Entry issues:", entryIssues);

  const targets = ["Kirby Bruff", "Chino Grind", "Billi Gates"];
  console.log("\n=== TARGET NOMINEES ===");
  for (const name of targets) {
    const matches = nominees.filter((n) => n.name.toLowerCase() === name.toLowerCase());
    for (const n of matches) {
      const expected = slugifyTicketPartner(n.name, n.id);
      const resolved = n.ticketPartnerSlug
        ? await resolveTicketPartnerBySlug(n.ticketPartnerSlug)
        : null;
      console.log({
        name: n.name,
        id: n.id,
        category: categoryTitleById(categories, n.categoryId),
        storedSlug: n.ticketPartnerSlug,
        expectedSlug: expected,
        resolvesTo: resolved?.sourceName,
      });
    }
    if (matches.length === 0) {
      const partial = nominees.filter((n) =>
        name.toLowerCase().split(" ").every((part) => n.name.toLowerCase().includes(part)),
      );
      console.log(`No exact match for ${name}; partial:`, partial.map((n) => n.name));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
