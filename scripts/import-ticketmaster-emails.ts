/**
 * One-time import of a Ticketmaster primary-email export into ticket_purchases.
 *
 * Usage:
 *   npx tsx scripts/import-ticketmaster-emails.ts "/path/to/emails.xlsx"
 *   npx tsx scripts/import-ticketmaster-emails.ts "/path/to/emails.csv"
 *   npx tsx scripts/import-ticketmaster-emails.ts "/path/to/emails.xlsx" --force
 *
 * Idempotent by default: if a prior batch with the same import key already has
 * rows, the script exits without writing duplicates. Pass --force to clear that
 * batch and re-import.
 *
 * Never auto-run from app code paths.
 */
import { execFileSync } from "child_process";
import { readFileSync } from "fs";
import { basename, extname, resolve } from "path";
import {
  clearTicketPurchases,
  createImportBatchId,
  listTicketPurchases,
  saveTicketPurchases,
} from "../src/lib/ticket-partner/purchases-store";
import { parseTicketmasterExport } from "../src/lib/ticket-partner/reconcile";

const IMPORT_BATCH_PREFIX = "tm_primary_em_20260808";

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
      // Vercel env pull sometimes embeds literal \n escapes in values.
      value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r").trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local optional when vars are already in the environment
  }
}

/** Reads email column values from a Ticketmaster .xlsx via Python's zip/xml stdlib. */
function extractEmailsFromXlsx(path: string): string[] {
  const py = `
import zipfile, xml.etree.ElementTree as ET, json, sys
path = sys.argv[1]
with zipfile.ZipFile(path) as z:
    ss = []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    for si in root.findall("m:si", ns):
        ss.append("".join((t.text or "") for t in si.findall(".//m:t", ns)))
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    emails = []
    for row in sheet.findall("m:sheetData/m:row", ns)[1:]:
        cells = row.findall("m:c", ns)
        if not cells:
            continue
        c = cells[0]
        t = c.attrib.get("t")
        v = c.find("m:v", ns)
        if v is None:
            continue
        val = ss[int(v.text)] if t == "s" else (v.text or "")
        val = (val or "").strip()
        if "@" in val:
            emails.append(val)
print(json.dumps(emails))
`.trim();

  const raw = execFileSync("python3", ["-c", py, path], { encoding: "utf8" });
  const emails = JSON.parse(raw) as string[];
  if (!Array.isArray(emails)) throw new Error("Unexpected xlsx parse result.");
  return emails;
}

function fileToCsv(path: string): string {
  const ext = extname(path).toLowerCase();
  if (ext === ".csv" || ext === ".tsv" || ext === ".txt") {
    return readFileSync(path, "utf8");
  }
  if (ext === ".xlsx") {
    const emails = extractEmailsFromXlsx(path);
    return ["PRIMARY_EM", ...emails].join("\n");
  }
  throw new Error(`Unsupported file type: ${ext || "(none)"}. Use .xlsx, .csv, or .tsv.`);
}

async function main() {
  loadEnvFile();

  const args = process.argv.slice(2).filter((a) => a !== "--force");
  const force = process.argv.includes("--force");
  const fileArg = args[0];
  if (!fileArg) {
    console.error(
      'Usage: npx tsx scripts/import-ticketmaster-emails.ts "/path/to/emails.xlsx" [--force]',
    );
    process.exit(1);
  }

  if (!process.env.SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (e.g. in .env.local).");
    process.exit(1);
  }

  const path = resolve(fileArg);
  const csv = fileToCsv(path);
  const parsed = parseTicketmasterExport(csv);
  if (parsed.error) {
    console.error(parsed.error);
    process.exit(1);
  }
  if (parsed.rows.length === 0) {
    console.error("No email rows found in the file.");
    process.exit(1);
  }

  const existing = await listTicketPurchases();
  const priorBatch = existing.filter((p) => p.importBatchId.startsWith(IMPORT_BATCH_PREFIX));
  if (priorBatch.length > 0 && !force) {
    console.log(
      `Already imported ${priorBatch.length} row(s) under batch prefix ${IMPORT_BATCH_PREFIX}.`,
    );
    console.log("Pass --force to clear that batch and re-import.");
    process.exit(0);
  }

  if (force && priorBatch.length > 0) {
    // Clear only rows from this import family (all matching prefixes).
    const batchIds = [...new Set(priorBatch.map((p) => p.importBatchId))];
    let removed = 0;
    for (const batchId of batchIds) {
      removed += await clearTicketPurchases(batchId);
    }
    console.log(`Cleared ${removed} prior import row(s).`);
  }

  const batchId = `${IMPORT_BATCH_PREFIX}_${createImportBatchId()}`;
  const saved = await saveTicketPurchases(parsed.rows, batchId);
  console.log(
    `Imported ${saved} purchase row(s) from ${basename(path)} (batch ${batchId}). Columns: ${parsed.columns.join(", ") || "none"}.`,
  );
  if (parsed.skipped) console.log(`Skipped ${parsed.skipped} blank row(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
