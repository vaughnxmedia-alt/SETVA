/**
 * Prune the analytics bloat (form_type = 'ticket_link_events') from form_submissions.
 *
 * These rows are an insert-only click/purchase tracking log. Nothing the public
 * site or voting depends on references them (only the HQ analytics dashboard),
 * so they are safe to delete. They are also the dominant row count in the table
 * and, because there is no index on form_type, they slow every other query.
 *
 * Strategy: form_type is not indexed, so filtering by it triggers a full scan
 * that times out. The primary key IS indexed, so we paginate the whole table by
 * PK (keyset) and delete the ticket_link_events rows we find, by PK, in small
 * sub-batches. One keep-alive connection, per-request timeouts, retries+backoff.
 *
 * Usage:
 *   npx tsx scripts/prune-ticket-link-events.ts            # dry run (counts only)
 *   npx tsx scripts/prune-ticket-link-events.ts --apply    # actually delete
 *   npx tsx scripts/prune-ticket-link-events.ts --apply --all   # delete click AND purchase events
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
const ALL_EVENTS = process.argv.includes("--all"); // also delete purchase events, not just clicks

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const PAGE_SIZE = 1000; // rows scanned per keyset page (PK index)
const DELETE_SUBBATCH = 100; // ids per DELETE (keeps URL length safe)
const REQ_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 6;

const TARGET_TYPE = "ticket_link_events";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function req(
  method: "GET" | "DELETE",
  path: string,
  extraHeaders: Record<string, string> = {},
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
          ...extraHeaders,
        },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      const body = await res.text();
      if (res.ok) return { ok: true, status: res.status, body };
      lastErr = `HTTP ${res.status}: ${body.slice(0, 200)}`;
    } catch (e) {
      clearTimeout(t);
      lastErr = (e as Error).name === "AbortError" ? "timeout" : (e as Error).message;
    }
    const backoff = Math.min(2000 * 2 ** attempt, 30_000);
    console.log(`   retry ${attempt + 1}/${MAX_RETRIES} after ${lastErr} (wait ${backoff}ms)`);
    await sleep(backoff);
  }
  throw new Error(`request failed after retries: ${method} ${path} :: ${lastErr}`);
}

async function pingOnce(): Promise<number | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  const start = Date.now();
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/form_submissions?select=id&order=id.asc&limit=1`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, signal: ctrl.signal },
    );
    clearTimeout(t);
    return res.ok ? Date.now() - start : null;
  } catch {
    clearTimeout(t);
    return null;
  }
}

async function preflight(): Promise<boolean> {
  // Wait up to ~8 min for the project to come back after a restart, and require
  // two consecutive healthy responses so we don't start mid-restart.
  process.stdout.write("Preflight: waiting for DB to respond to a PK lookup (restart-safe)... ");
  let consecutive = 0;
  for (let i = 0; i < 96; i++) {
    const ms = await pingOnce();
    if (ms !== null) {
      consecutive++;
      if (consecutive >= 2) {
        console.log(`ok (${ms}ms)`);
        return true;
      }
    } else {
      consecutive = 0;
    }
    process.stdout.write(ms !== null ? "+" : ".");
    await sleep(5000);
  }
  console.log(" still unresponsive.");
  return false;
}

async function main() {
  if (!SUPABASE_URL || !KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const healthy = await preflight();
  if (!healthy) {
    console.error(
      "\nDatabase is still not responding. Restart the Supabase project (Dashboard -> Project Settings -> General -> Restart) and re-run.",
    );
    process.exit(2);
  }

  console.log(
    `\nMode: ${APPLY ? "APPLY (deleting)" : "DRY RUN (counting)"} | scope: ${ALL_EVENTS ? "all ticket_link_events" : "click events only"}\n`,
  );

  let cursor = ""; // last seen id
  let scanned = 0;
  let matched = 0;
  let deleted = 0;
  let pages = 0;
  const startTime = Date.now();

  while (true) {
    const filter = cursor ? `&id=gt.${cursor}` : "";
    const path = `/rest/v1/form_submissions?select=id,form_type,status&order=id.asc&limit=${PAGE_SIZE}${filter}`;
    const { body } = await req("GET", path);
    let rows: { id: string; form_type: string; status: string | null }[];
    try {
      rows = JSON.parse(body);
    } catch {
      throw new Error(`Bad JSON page response: ${body.slice(0, 200)}`);
    }
    if (rows.length === 0) break;

    pages++;
    scanned += rows.length;
    cursor = rows[rows.length - 1].id;

    const targets = rows.filter((r) => {
      if (r.form_type !== TARGET_TYPE) return false;
      if (ALL_EVENTS) return true;
      return r.status !== "purchase"; // keep purchase events unless --all
    });
    matched += targets.length;

    if (APPLY && targets.length > 0) {
      for (let i = 0; i < targets.length; i += DELETE_SUBBATCH) {
        const chunk = targets.slice(i, i + DELETE_SUBBATCH);
        const idList = chunk.map((r) => r.id).join(",");
        await req("DELETE", `/rest/v1/form_submissions?id=in.(${idList})`, {
          Prefer: "count=none",
        });
        deleted += chunk.length;
      }
    }

    if (pages % 10 === 0 || rows.length < PAGE_SIZE) {
      const secs = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(
        `page ${pages}: scanned=${scanned} matched=${matched} deleted=${deleted} (${secs}s) cursor=${cursor.slice(0, 8)}`,
      );
    }

    if (rows.length < PAGE_SIZE) break; // last page
  }

  const secs = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(
    `\nDone in ${secs}s. Scanned ${scanned} rows across ${pages} pages. ` +
      `${TARGET_TYPE} ${ALL_EVENTS ? "(all)" : "(clicks)"}: matched=${matched}, deleted=${deleted}.`,
  );
  if (!APPLY) {
    console.log("Dry run only — re-run with --apply to delete.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
