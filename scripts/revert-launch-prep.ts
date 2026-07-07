/**
 * Undo bulk launch-voting-prep changes, resiliently.
 *
 * Goes back to the "original site": only nominees that HAD a graphic stay
 * published. Every entry that Launch Prep bulk-published (or any published
 * entry with no graphic) is set back to Draft. Category videos that Launch
 * Prep force-enabled are turned back off, keeping only the ones that were
 * live before launch.
 *
 * Writes go straight through the Supabase admin client (one query per record)
 * with retries, and the script is resumable — rerun until it reports 0 left.
 *
 *   npx tsx scripts/revert-launch-prep.ts            # dry run
 *   npx tsx scripts/revert-launch-prep.ts --apply
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const APPLY = process.argv.includes("--apply");
const CONCURRENCY = 3;
const MAX_RETRIES = 5;

const VIDEO_KEEP_LIVE_TITLES = new Set([
  "Music: Artist of the Year",
  "Music: Album of the Year",
  "Music: Band of the Year",
  "Music: Best Collaboration",
  "Music: Breakthrough Artist of the Year",
]);

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const wait = Math.min(1000 * 2 ** (attempt - 1), 8000);
      console.warn(`  retry ${attempt}/${MAX_RETRIES} for ${label} after error; waiting ${wait}ms`);
      await sleep(wait);
    }
  }
  throw lastError;
}

function truthy(value: unknown): boolean {
  return value === true || value === "true" || value === "Yes";
}

function hasGraphic(payload: Record<string, unknown>): boolean {
  return Boolean(
    String(payload.nomineeGraphicUrl ?? "").trim() ||
      String(payload.nomineeGraphicMediaId ?? "").trim(),
  );
}

async function main() {
  const { supabaseAdmin } = await import("../src/lib/supabase/server");
  const { FORM_TYPES } = await import("../src/lib/form-submissions");

  const client = supabaseAdmin();
  if (!client) {
    console.error("Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
    process.exit(1);
  }

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  // 1. Page entries — unpublish launch-prep + no-graphic entries.
  const { data: entryRows, error: entryError } = await withRetry("list page entries", async () =>
    client
      .from("form_submissions")
      .select("external_id, status, payload")
      .eq("form_type", FORM_TYPES.nomineePageEntries),
  );
  if (entryError) throw entryError;

  const targets = (entryRows ?? []).filter((row) => {
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    const isPublished = truthy(payload.publishToNomineePage) && payload.status === "Published";
    if (!isPublished) return false;
    const fromLaunchPrep = payload.createdByName === "Launch Prep";
    return fromLaunchPrep || !hasGraphic(payload);
  });

  console.log(`Published page entries total: ${(entryRows ?? []).filter((r) => truthy((r.payload as Record<string, unknown>)?.publishToNomineePage) && (r.payload as Record<string, unknown>)?.status === "Published").length}`);
  console.log(`To unpublish (launch prep or no graphic): ${targets.length}\n`);

  let done = 0;
  let failed = 0;

  if (APPLY && targets.length) {
    for (let i = 0; i < targets.length; i += CONCURRENCY) {
      const batch = targets.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (row) => {
          const payload = { ...(row.payload as Record<string, unknown>) };
          payload.publishToNomineePage = false;
          payload.status = "Draft";
          try {
            const { error } = await withRetry(String(row.external_id), async () =>
              client
                .from("form_submissions")
                .update({ status: "draft", payload })
                .eq("external_id", row.external_id)
                .eq("form_type", FORM_TYPES.nomineePageEntries),
            );
            if (error) throw error;
            done += 1;
          } catch (error) {
            failed += 1;
            console.error(`  FAILED ${row.external_id}:`, error);
          }
        }),
      );
      console.log(`  unpublished ${Math.min(i + CONCURRENCY, targets.length)}/${targets.length}`);
      await sleep(150);
    }
  }

  // 2. Category videos — turn off videos Launch Prep force-enabled.
  const { data: categoryRecord, error: categoryError } = await withRetry("categories", async () =>
    client
      .from("form_submissions")
      .select("external_id, payload")
      .eq("form_type", FORM_TYPES.nomineeCategories)
      .eq("external_id", "setva-nominee-categories")
      .maybeSingle(),
  );
  if (categoryError) throw categoryError;

  let videosReverted = 0;
  if (categoryRecord) {
    const payload = categoryRecord.payload as { categories?: Array<Record<string, unknown>> };
    const categories = payload.categories ?? [];
    const updated = categories.map((category) => {
      if (!truthy(category.publishVideo)) return category;
      if (VIDEO_KEEP_LIVE_TITLES.has(String(category.title))) return category;
      videosReverted += 1;
      return { ...category, publishVideo: false };
    });

    console.log(`\nCategory videos to turn off: ${videosReverted}`);
    if (APPLY && videosReverted > 0) {
      const { error } = await withRetry("save categories", async () =>
        client
          .from("form_submissions")
          .update({ payload: { ...payload, categories: updated } })
          .eq("external_id", "setva-nominee-categories")
          .eq("form_type", FORM_TYPES.nomineeCategories),
      );
      if (error) throw error;
    }
  }

  console.log("\n--- Result ---");
  if (APPLY) {
    console.log(`Unpublished: ${done}`);
    console.log(`Failed: ${failed}`);
    console.log(`Category videos turned off: ${videosReverted}`);
    console.log(failed > 0 ? "Some failed — rerun to finish the rest." : "Revert complete.");
  } else {
    console.log(`Would unpublish ${targets.length} entries and turn off ${videosReverted} videos.`);
    console.log("Re-run with --apply.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
