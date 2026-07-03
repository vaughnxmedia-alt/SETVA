import { resolve } from "path";
import { readFileSync } from "fs";

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
  const { listNomineeCategories } = await import("../src/lib/nominee-categories-store");
  const { listNominees } = await import("../src/lib/nominees-store");
  const { listNomineePageEntries } = await import("../src/lib/nominee-workflows-store");

  const cats = await listNomineeCategories();
  const noms = await listNominees();
  const entries = await listNomineePageEntries();

  console.log("=== CATEGORIES (" + cats.length + ") ===");
  for (const c of cats) console.log(`${c.id}\t| ${c.title}\t| status=${c.status}`);

  const byCat: Record<string, string[]> = {};
  for (const n of noms) (byCat[n.categoryId] ||= []).push(`${n.name}  <${n.id}>`);

  console.log("\n=== NOMINEES (" + noms.length + ") ===");
  for (const c of cats) {
    console.log(`\n[${c.title}] (${c.id})`);
    for (const nm of byCat[c.id] || []) console.log("   - " + nm);
  }
  const orphanCats = Object.keys(byCat).filter((id) => !cats.find((c) => c.id === id));
  for (const id of orphanCats) {
    console.log(`\n[UNKNOWN CATEGORY ${id}]`);
    for (const nm of byCat[id]) console.log("   - " + nm);
  }

  console.log("\n=== PAGE ENTRIES (" + entries.length + ") ===");
  for (const e of entries) {
    console.log(
      `${e.nomineeId}\t| cat=${e.categoryId}\t| graphic=${e.nomineeGraphicUrl ? "YES" : "no"}\t| publish=${e.publishToNomineePage}\t| ${e.status}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
