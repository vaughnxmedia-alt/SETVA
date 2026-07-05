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

type Issue = {
  severity: "error" | "warn";
  code: string;
  message: string;
};

async function main() {
  const { listNominees, listNomineesWithTicketPartnerSlugs } = await import("../src/lib/nominees-store");
  const { listNomineePageEntries, listPublishedNomineePageCategories } = await import(
    "../src/lib/nominee-workflows-store"
  );
  const { slugifyTicketPartner, ticketPartnerTrackingPath } = await import(
    "../src/lib/ticket-partner/links"
  );
  const { resolveTicketPartnerBySlug } = await import("../src/lib/ticket-partner/resolve");
  const { categoryTitleById, listNomineeCategories } = await import(
    "../src/lib/nominee-categories-store"
  );
  const { getHQNomineeTicketPartners } = await import("../src/lib/headquarters/data");

  const issues: Issue[] = [];
  function error(code: string, message: string) {
    issues.push({ severity: "error", code, message });
  }
  function warn(code: string, message: string) {
    issues.push({ severity: "warn", code, message });
  }

  const nominees = await listNominees();
  const nomineesWithSlugs = await listNomineesWithTicketPartnerSlugs();
  const entries = await listNomineePageEntries();
  const categories = await listNomineeCategories();
  const publicCategories = await listPublishedNomineePageCategories();
  const hqLinks = await getHQNomineeTicketPartners();

  const byId = new Map(nominees.map((n) => [n.id, n]));
  const categoryById = new Map(categories.map((c) => [c.id, c.title]));

  console.log("=== NOMINEE LINK FULL AUDIT ===\n");
  console.log(`Nominee records: ${nominees.length}`);
  console.log(`With ticket slugs: ${nomineesWithSlugs.length}`);
  console.log(`Published page entries: ${entries.filter((e) => e.publishToNomineePage && e.status === "Published").length}`);
  console.log(`Public categories with cards: ${publicCategories.length}`);
  console.log(`HQ ticket link rows: ${hqLinks.length}\n`);

  // 1. Stored slug integrity for every nominee record
  console.log("--- 1. Nominee slug integrity ---");
  const slugOwners = new Map<string, string[]>();
  for (const n of nomineesWithSlugs) {
    const slug = n.ticketPartnerSlug.trim();
    if (!slug) {
      error("missing_slug", `No ticket slug: ${n.name} (${n.id})`);
      continue;
    }
    const expected = slugifyTicketPartner(n.name, n.id);
    if (slug.toLowerCase() !== expected.toLowerCase()) {
      error(
        "slug_mismatch",
        `${n.name} [${categoryTitleById(categories, n.categoryId)}]: stored "${slug}" expected "${expected}"`,
      );
    }
    const owners = slugOwners.get(slug.toLowerCase()) ?? [];
    owners.push(`${n.name} (${n.id})`);
    slugOwners.set(slug.toLowerCase(), owners);

    const resolved = await resolveTicketPartnerBySlug(slug);
    if (!resolved) {
      error("resolve_null", `${n.name}: slug "${slug}" does not resolve`);
    } else if (resolved.sourceId !== n.id) {
      error(
        "resolve_wrong_person",
        `${n.name} (${n.id}): slug "${slug}" resolves to ${resolved.sourceName} (${resolved.sourceId})`,
      );
    } else if (resolved.sourceName !== n.name) {
      error(
        "resolve_name_mismatch",
        `${n.name}: resolved name "${resolved.sourceName}" differs from record`,
      );
    }

    const canonicalResolved = await resolveTicketPartnerBySlug(expected);
    if (!canonicalResolved || canonicalResolved.sourceId !== n.id) {
      error(
        "canonical_resolve_fail",
        `${n.name}: canonical slug "${expected}" fails to resolve to this record`,
      );
    }
  }

  for (const [slug, owners] of slugOwners.entries()) {
    if (owners.length > 1) {
      error("duplicate_slug", `Slug "${slug}" shared by: ${owners.join(" | ")}`);
    }
  }

  // 2. Published page entries → nominee + category alignment
  console.log("--- 2. Published page entries ---");
  const published = entries.filter((e) => e.publishToNomineePage && e.status === "Published");
  for (const entry of published) {
    const nom = byId.get(entry.nomineeId);
    const pageCategory = categoryById.get(entry.categoryId) ?? entry.categoryId;

    if (!nom) {
      error("entry_missing_nominee", `Page entry ${entry.id} references missing nominee ${entry.nomineeId}`);
      continue;
    }

    if (nom.categoryId !== entry.categoryId) {
      error(
        "entry_category_mismatch",
        `${nom.name}: page entry in "${pageCategory}" but nominee record category is "${categoryTitleById(categories, nom.categoryId)}" (entry ${entry.id})`,
      );
    }

    if (!entry.nomineeGraphicUrl && !entry.nomineeGraphicMediaId) {
      warn("entry_no_graphic", `${nom.name} in "${pageCategory}": published without graphic`);
    }

    const slug = slugifyTicketPartner(nom.name, nom.id);
    const resolved = await resolveTicketPartnerBySlug(slug);
    if (!resolved || resolved.sourceId !== nom.id) {
      error(
        "entry_link_wrong_person",
        `Public card ${nom.name} in "${pageCategory}" would link to wrong person via ${slug}`,
      );
    }
  }

  // 3. Public nominations page cards (what fans see)
  console.log("--- 3. Public nominations cards ---");
  let publicCardCount = 0;
  for (const category of publicCategories) {
    for (const card of category.nominees) {
      publicCardCount += 1;
      const nom = byId.get(card.nomineeId);
      if (!nom) {
        error("public_missing_nominee", `Card "${card.nomineeName}" in ${category.title}: nominee ${card.nomineeId} not found`);
        continue;
      }

      if (card.nomineeName !== nom.name) {
        error(
          "public_name_mismatch",
          `${category.title}: card shows "${card.nomineeName}" but nominee record is "${nom.name}"`,
        );
      }

      const expectedSlug = slugifyTicketPartner(nom.name, nom.id);
      const expectedHref = ticketPartnerTrackingPath(expectedSlug);
      if (card.ticketHref !== expectedHref) {
        error(
          "public_href_mismatch",
          `${nom.name} in ${category.title}: href "${card.ticketHref}" expected "${expectedHref}"`,
        );
      }

      const slugFromHref = decodeURIComponent(card.ticketHref.replace(/^\/go\/tickets\//, ""));
      const resolved = await resolveTicketPartnerBySlug(slugFromHref);
      if (!resolved) {
        error("public_link_dead", `${nom.name} in ${category.title}: link does not resolve (${card.ticketHref})`);
      } else if (resolved.sourceId !== nom.id) {
        error(
          "public_link_wrong_person",
          `${category.title}: "${nom.name}" link resolves to ${resolved.sourceName} (${resolved.sourceId})`,
        );
      } else if (resolved.category !== category.title) {
        // resolved.category comes from nominee record categoryId — should match page category
        error(
          "public_category_mismatch",
          `${nom.name}: shown in "${category.title}" but ticket partner category is "${resolved.category}"`,
        );
      }
    }
  }
  console.log(`Checked ${publicCardCount} public nomination cards`);

  // 4. HQ Ambassadors nominee ticket links table
  console.log("--- 4. HQ nominee ticket links ---");
  const hqById = new Map(hqLinks.map((row) => [row.id, row]));
  for (const row of hqLinks) {
    const nom = byId.get(row.id);
    if (!nom) {
      error("hq_missing_nominee", `HQ link row for unknown id ${row.id} (${row.name})`);
      continue;
    }
    if (row.name !== nom.name) {
      error("hq_name_mismatch", `HQ row ${row.id}: name "${row.name}" vs record "${nom.name}"`);
    }
    const expectedCategory = categoryTitleById(categories, nom.categoryId);
    if (row.category !== expectedCategory) {
      error(
        "hq_category_mismatch",
        `${nom.name}: HQ shows "${row.category}" but record is "${expectedCategory}"`,
      );
    }
    const expectedSlug = slugifyTicketPartner(nom.name, nom.id);
    if (row.ticketPartnerSlug.toLowerCase() !== expectedSlug.toLowerCase()) {
      error(
        "hq_slug_mismatch",
        `${nom.name}: HQ slug "${row.ticketPartnerSlug}" expected "${expectedSlug}"`,
      );
    }
    if (!row.trackingUrl.includes(encodeURIComponent(expectedSlug))) {
      error(
        "hq_url_mismatch",
        `${nom.name}: tracking URL "${row.trackingUrl}" missing slug "${expectedSlug}"`,
      );
    }
  }

  // Nominees with slugs but missing from HQ table
  for (const n of nomineesWithSlugs) {
    if (!hqById.has(n.id)) {
      warn("hq_missing_row", `${n.name} has slug but no HQ ticket link row`);
    }
  }

  // 5. Orphan / duplicate page entries per category
  console.log("--- 5. Page entry duplicates ---");
  const seenInCategory = new Map<string, string>();
  for (const entry of published) {
    const key = `${entry.categoryId}:${entry.nomineeId}`;
    const prior = seenInCategory.get(key);
    if (prior) {
      error(
        "duplicate_page_entry",
        `Duplicate published entry for nominee ${entry.nomineeId} in category ${entry.categoryId} (${prior} and ${entry.id})`,
      );
    } else {
      seenInCategory.set(key, entry.id);
    }
  }

  // Summary
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warn");

  console.log("\n=== SUMMARY ===");
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log("\nERRORS:");
    for (const issue of errors) {
      console.log(`  [${issue.code}] ${issue.message}`);
    }
  }
  if (warnings.length > 0) {
    console.log("\nWARNINGS:");
    for (const issue of warnings) {
      console.log(`  [${issue.code}] ${issue.message}`);
    }
  }

  if (errors.length === 0) {
    console.log("\n✓ All nominee links verified — no errors found.");
  } else {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
