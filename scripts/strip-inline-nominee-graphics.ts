/**
 * Remove inline data: URI graphics from nominee_page_entries payloads.
 *
 * These base64 blobs (~13MB total) force every /nominations request to download
 * and parse a huge JSON payload from Postgres, which overwhelms Supabase and
 * causes Vercel server timeouts under traffic. Hosted https:// URLs are kept.
 *
 * After stripping, re-upload graphics through HQ (file upload → Storage).
 *
 * Usage:
 *   npx tsx scripts/strip-inline-nominee-graphics.ts           # dry run
 *   npx tsx scripts/strip-inline-nominee-graphics.ts --apply   # write to Supabase
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

const APPLY = process.argv.includes("--apply");
const FORM_TYPE = "nominee_page_entries";
const PAGE_SIZE = 50;
const REQ_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 5;

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function req(
  method: "GET" | "PATCH",
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; body: string }> {
  let lastErr = "";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), REQ_TIMEOUT_MS);
    try {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        method,
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
          Prefer: method === "PATCH" ? "return=minimal" : "",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const text = await res.text();
      if (res.ok) return { ok: true, status: res.status, body: text };
      lastErr = `HTTP ${res.status}: ${text.slice(0, 200)}`;
    } catch (e) {
      clearTimeout(t);
      lastErr = (e as Error).name === "AbortError" ? "timeout" : (e as Error).message;
    }
    await sleep(Math.min(2000 * 2 ** attempt, 20_000));
  }
  throw new Error(`${method} ${path} failed: ${lastErr}`);
}

type Row = {
  id: string;
  external_id: string | null;
  payload: Record<string, unknown>;
};

function inlineGraphicBytes(url: string): number {
  if (!url.startsWith("data:")) return 0;
  const comma = url.indexOf(",");
  return comma === -1 ? url.length : url.length - comma - 1;
}

async function main() {
  if (!SUPABASE_URL || !KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  let cursor = "";
  let scanned = 0;
  let inline = 0;
  let stripped = 0;
  let inlineBytes = 0;
  let pages = 0;

  while (true) {
    const filter = cursor ? `&id=gt.${cursor}` : "";
    const { body } = await req(
      "GET",
      `/rest/v1/form_submissions?select=id,external_id,form_type,payload&order=id.asc&limit=${PAGE_SIZE}${filter}`,
    );
    const pageRows = JSON.parse(body) as {
      id: string;
      form_type: string;
      external_id: string | null;
      payload: Record<string, unknown>;
    }[];
    if (pageRows.length === 0) break;

    pages++;
    cursor = pageRows[pageRows.length - 1].id;
    const rows = pageRows.filter((row) => row.form_type === FORM_TYPE);
    scanned += rows.length;

    for (const row of rows) {
      const graphicUrl = String(row.payload.nomineeGraphicUrl ?? "");
      if (!graphicUrl.startsWith("data:")) continue;

      inline += 1;
      inlineBytes += inlineGraphicBytes(graphicUrl);

      if (!APPLY) continue;

      const nextPayload = { ...row.payload, nomineeGraphicUrl: "" };
      await req("PATCH", `/rest/v1/form_submissions?id=eq.${row.id}`, { payload: nextPayload });
      stripped += 1;
      process.stdout.write(".");
    }

    if (pages % 5 === 0) {
      console.log(
        `page ${pages}: scanned=${scanned} inline=${inline} stripped=${stripped} (~${(inlineBytes / 1024 / 1024).toFixed(1)}MB base64)`,
      );
    }

    if (pageRows.length < PAGE_SIZE) break;
  }

  console.log(
    `\nDone. ${scanned} page entries scanned. ${inline} had inline data: URIs (~${(inlineBytes / 1024 / 1024).toFixed(1)}MB). Stripped: ${stripped}.`,
  );
  if (!APPLY && inline > 0) {
    console.log("Dry run only — re-run with --apply to strip inline graphics from the database.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
