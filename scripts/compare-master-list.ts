/**
 * Read-only comparison: Master List xlsx vs HQ/Supabase nominees & categories.
 */
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { listNomineeCategories } from "../src/lib/nominee-categories-store";
import { listNominees } from "../src/lib/nominees-store";
import type { NomineeCategory } from "../src/lib/nominees";

type MasterCategory = {
  section: string;
  sortOrder: number;
  title: string;
  nominees: string[];
  isSpecial: boolean;
};

const SECTION_MAP: Record<string, string> = {
  "musical categories": "Music",
  "film / media": "Film / Media",
  creative: "Creative",
  business: "Business",
  special: "Special",
};

const CATEGORY_ALIASES: Record<string, string> = {
  "best sound engineer music producer of the year": "best music producer",
  "best songwriter": "best song writer",
  "best hip hop rap artist": "best hip hop rap artist",
  "alternative pop artist of the year": "alternative pop artist of the year",
  "best photographer": "best photographers",
  "stand up comedian of the year": "comedian of the year",
  "digital comedian of the year": "digital comedian of the year",
  "best radio host": "best radio host",
  "radio station of the year": "radio station of the year",
  "the visionary spirit award": "the visionary spirit award",
  "visionary valor": "visionary valor award",
  "community event of the year": "community event of the year",
  "best director": "best director",
  "best talk show": "best talk show",
};

function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCategoryTitle(value: string): string {
  let title = value.replace(/^\*+\s*|\s*\*+$/g, "").trim();
  title = title.replace(/^[^:]+:\s*/, ""); // strip HQ section prefix
  return normalizeName(title)
    .replace(/\bof the year of the year\b/g, "of the year")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryAliasKey(section: string, title: string): string {
  const norm = normalizeCategoryTitle(title);
  return CATEGORY_ALIASES[norm] ?? norm;
}

function hqSectionAndTitle(fullTitle: string): { section: string; title: string } {
  const match = fullTitle.match(/^([^:]+):\s*(.+)$/);
  if (!match) return { section: "", title: fullTitle };
  return { section: match[1].trim(), title: match[2].trim() };
}

function parseMasterList(filePath: string): MasterCategory[] {
  const workbook = XLSX.read(readFileSync(filePath), { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const categories: MasterCategory[] = [];
  let section = "";

  for (const row of rows) {
    const cells = row.map((cell) => String(cell ?? "").trim());
    const joined = cells.join(" ").trim();
    if (!joined) continue;

    const first = cells[0]?.toLowerCase();
    if (SECTION_MAP[first]) {
      section = cells[0];
      continue;
    }

    if (cells[1] === "Nominees" || cells[1] === "Awardees" || cells[2] === "Nominees") continue;

    const sortOrder = Number.parseInt(String(cells[1]), 10);
    const title = cells[2]?.replace(/^\*+\s*|\s*\*+$/g, "").trim();
    if (!title || Number.isNaN(sortOrder)) continue;

    const nominees = cells.slice(3).map((name) => name.trim()).filter(Boolean);
    categories.push({
      section,
      sortOrder,
      title,
      nominees,
      isSpecial: section.toLowerCase() === "special",
    });
  }

  return categories;
}

function matchHqCategory(
  master: MasterCategory,
  hqCategories: NomineeCategory[],
): NomineeCategory | undefined {
  const masterSection = SECTION_MAP[master.section.toLowerCase()] ?? master.section;
  const masterKey = categoryAliasKey(masterSection, master.title);

  const candidates = hqCategories.filter((hq) => {
    const { section, title } = hqSectionAndTitle(hq.title);
    if (section !== masterSection) return false;
    const hqKey = categoryAliasKey(section, title);
    if (hqKey === masterKey) return true;
    // Visionary spirit duplicates
    if (masterKey.includes("visionary spirit") && hqKey.includes("visionary spirit")) return true;
    return false;
  });

  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    // Pillars etc — same title, pick by nominee count closest
    return candidates[0];
  }

  // Cross-section fallbacks
  if (masterKey === "comedian of the year") {
    return hqCategories.find((hq) => {
      const { section, title } = hqSectionAndTitle(hq.title);
      return section === "Creative" && normalizeCategoryTitle(title) === "comedian of the year";
    });
  }

  if (masterKey === "radio station of the year") {
    return hqCategories.find((hq) => normalizeCategoryTitle(hq.title).includes("talk show"));
  }

  return undefined;
}

function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const sa = new Set(na.split(" "));
  const sb = new Set(nb.split(" "));
  const inter = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union ? inter / union : 0;
}

function pairNames(masterNames: string[], hqNames: string[]) {
  const inMasterOnly: string[] = [];
  const inHqOnly = [...hqNames];
  const matched: { master: string; hq: string; score: number }[] = [];
  const usedHq = new Set<number>();

  for (const master of masterNames) {
    let bestIdx = -1;
    let bestScore = 0.88;
    for (let i = 0; i < inHqOnly.length; i++) {
      if (usedHq.has(i)) continue;
      const score = nameSimilarity(master, inHqOnly[i]);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      matched.push({ master, hq: inHqOnly[bestIdx], score: bestScore });
      usedHq.add(bestIdx);
    } else {
      inMasterOnly.push(master);
    }
  }

  const hqOnly = inHqOnly.filter((_, i) => !usedHq.has(i));
  const fuzzy = matched.filter((m) => m.score < 1);

  return { inMasterOnly, inHqOnly: hqOnly, fuzzy };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/compare-master-list.ts <path-to-xlsx>");
    process.exit(1);
  }

  const master = parseMasterList(filePath);
  const [hqCategories, hqNominees] = await Promise.all([listNomineeCategories(), listNominees()]);

  const hqNomineesByCategory = new Map<string, string[]>();
  for (const nominee of hqNominees) {
    const list = hqNomineesByCategory.get(nominee.categoryId) ?? [];
    list.push(nominee.name);
    hqNomineesByCategory.set(nominee.categoryId, list);
  }

  const matchedHqIds = new Set<string>();
  const unmatchedMaster: MasterCategory[] = [];
  const categoryReports: string[] = [];
  let totalMasterOnly = 0;
  let totalHqOnly = 0;
  let totalFuzzy = 0;
  let matchedCategories = 0;

  for (let i = 0; i < master.length; i++) {
    const m = master[i];
    const hq = matchHqCategory(m, hqCategories);
    if (!hq) {
      unmatchedMaster.push(m);
      continue;
    }
    matchedHqIds.add(hq.id);
    matchedCategories += 1;

    const hqNames = (hqNomineesByCategory.get(hq.id) ?? []).filter((n) => !n.startsWith("Name needed"));
    const { inMasterOnly, inHqOnly, fuzzy } = pairNames(m.nominees, hqNames);

    if (inMasterOnly.length || inHqOnly.length || fuzzy.length || m.nominees.length !== hqNames.length) {
      categoryReports.push(
        `\n#${i + 1} [${m.section}] ${m.title}`,
        `   HQ: ${hq.title}`,
        `   Counts — master: ${m.nominees.length}, HQ: ${hqNames.length}`,
      );
      if (inMasterOnly.length) {
        categoryReports.push(`   In MASTER only (${inMasterOnly.length}):`);
        inMasterOnly.forEach((n) => categoryReports.push(`     + ${n}`));
        totalMasterOnly += inMasterOnly.length;
      }
      if (inHqOnly.length) {
        categoryReports.push(`   In HQ only (${inHqOnly.length}):`);
        inHqOnly.forEach((n) => categoryReports.push(`     - ${n}`));
        totalHqOnly += inHqOnly.length;
      }
      if (fuzzy.length) {
        categoryReports.push(`   Spelling / variant matches (${fuzzy.length}):`);
        fuzzy.forEach((f) => categoryReports.push(`     ~ "${f.master}" ↔ "${f.hq}"`));
        totalFuzzy += fuzzy.length;
      }
    }
  }

  const unmatchedHq = hqCategories.filter((c) => !matchedHqIds.has(c.id));

  console.log("=== SUMMARY ===");
  console.log(`Master list rows: ${master.length} categories`);
  console.log(`HQ categories: ${hqCategories.length}`);
  console.log(`Matched category pairs: ${matchedCategories}`);
  console.log(`Master nominee names: ${master.reduce((n, c) => n + c.nominees.length, 0)}`);
  console.log(`HQ nominee records: ${hqNominees.length} (${hqNominees.filter((n) => n.name.startsWith("Name needed")).length} placeholders)`);
  console.log("");

  if (unmatchedMaster.length) {
    console.log(`=== CATEGORIES IN MASTER WITH NO HQ MATCH (${unmatchedMaster.length}) ===`);
    master.forEach((m, i) => {
      if (!unmatchedMaster.includes(m)) return;
      console.log(`  #${master.indexOf(m) + 1} [${m.section}] ${m.title} (${m.nominees.length} nominees)`);
    });
    console.log("");
  }

  if (unmatchedHq.length) {
    console.log(`=== CATEGORIES IN HQ WITH NO MASTER MATCH (${unmatchedHq.length}) ===`);
    unmatchedHq.forEach((c) => {
      const count = (hqNomineesByCategory.get(c.id) ?? []).length;
      console.log(`  - ${c.title} (${count} nominees)`);
    });
    console.log("");
  }

  console.log("=== NOMINEE DIFFERENCES (matched categories) ===");
  console.log(`Categories with nominee differences: ${categoryReports.filter((l) => l.startsWith("\n#")).length}`);
  console.log(`Names in master only: ${totalMasterOnly}`);
  console.log(`Names in HQ only: ${totalHqOnly}`);
  console.log(`Spelling variants: ${totalFuzzy}`);
  if (categoryReports.length) console.log(categoryReports.join("\n"));

  const placeholders = hqNominees.filter((n) => n.name.startsWith("Name needed"));
  if (placeholders.length) {
    console.log(`\n=== HQ PLACEHOLDERS (${placeholders.length}) — restored orphans, not in master ===`);
    for (const p of placeholders) {
      const cat = hqCategories.find((c) => c.id === p.categoryId);
      console.log(`  - ${p.name} → ${cat?.title ?? p.categoryId}`);
    }
  }

  console.log("\n=== MASTER LIST INDEX (for reference) ===");
  master.forEach((c, i) => {
    const hq = matchHqCategory(c, hqCategories);
    const flag = hq ? "✓" : "✗";
    console.log(`${String(i + 1).padStart(2)}. ${flag} [${c.section}] ${c.title} (${c.nominees.length})${hq ? ` → ${hq.title}` : ""}`);
  });

  // Tight summary: only gaps with similarity threshold 0.88
  let exactCats = 0;
  const tightGaps: string[] = [];
  for (let i = 0; i < master.length; i++) {
    const m = master[i];
    const hq = matchHqCategory(m, hqCategories);
    if (!hq) continue;
    const hqNames = (hqNomineesByCategory.get(hq.id) ?? []).filter((n) => !n.startsWith("Name needed"));
    const { inMasterOnly, inHqOnly } = pairNames(m.nominees, hqNames);
    const tightMaster = inMasterOnly.filter(
      (name) => !hqNames.some((hqName) => nameSimilarity(name, hqName) >= 0.88),
    );
    const tightHq = inHqOnly.filter(
      (name) => !m.nominees.some((masterName) => nameSimilarity(name, masterName) >= 0.88),
    );
    if (!tightMaster.length && !tightHq.length) exactCats += 1;
    else if (tightMaster.length || tightHq.length) {
      tightGaps.push(`#${i + 1} ${m.title}: +${tightMaster.length} master / -${tightHq.length} HQ`);
    }
  }

  console.log("\n=== TIGHT SUMMARY (ignoring close spelling matches) ===");
  console.log(`Categories with all names aligned: ${exactCats} / ${master.length}`);
  console.log(`Categories with real gaps: ${tightGaps.length}`);
  tightGaps.forEach((line) => console.log(`  ${line}`));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
