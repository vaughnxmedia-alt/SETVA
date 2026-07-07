/**
 * Time each form_type query against form_submissions to find slow queries.
 *   npx tsx scripts/probe-form-submissions.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";

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

loadEnvFile();

const TYPES = [
  "nominees",
  "nominee_categories",
  "nominee_page_entries",
  "nominee_magazine_articles",
  "nominee_voting_setups",
  "nominee_media_assets",
];

async function main() {
  const { supabaseAdmin } = await import("../src/lib/supabase/server");
  const client = supabaseAdmin();
  if (!client) {
    console.log("no supabase admin client (missing env)");
    return;
  }

  // total row count of the whole table
  const tAll = Date.now();
  const { count: totalRows, error: totalErr } = await client
    .from("form_submissions")
    .select("id", { count: "exact", head: true });
  console.log(
    `TOTAL rows in form_submissions: ${totalErr ? "ERR " + totalErr.message : totalRows} (${Date.now() - tAll}ms)`,
  );

  for (const t of TYPES) {
    const t0 = Date.now();
    let countStr = "?";
    try {
      const { count, error } = await client
        .from("form_submissions")
        .select("id", { count: "exact", head: true })
        .eq("form_type", t);
      countStr = error ? `ERR ${error.message}` : String(count);
    } catch (e) {
      countStr = `THROW ${(e as Error).message}`;
    }
    const tCount = Date.now() - t0;

    const t1 = Date.now();
    let bytes = 0;
    let rows = 0;
    let full = "ok";
    try {
      const { data, error } = await client
        .from("form_submissions")
        .select("*")
        .eq("form_type", t)
        .order("submitted_at", { ascending: false });
      if (error) full = `ERR ${error.message}`;
      else {
        rows = data?.length ?? 0;
        bytes = Buffer.byteLength(JSON.stringify(data ?? []));
      }
    } catch (e) {
      full = `THROW ${(e as Error).message}`;
    }
    const tFull = Date.now() - t1;

    console.log(
      `${t.padEnd(26)} count=${String(countStr).padEnd(6)} (${tCount}ms)  full=${full} rows=${rows} ${(bytes / 1024 / 1024).toFixed(2)}MB (${tFull}ms)`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
