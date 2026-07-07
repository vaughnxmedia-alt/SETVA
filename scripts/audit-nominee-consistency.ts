import { FORM_TYPES, listFormSubmissions } from "../src/lib/form-submissions";
import { getNomineeConsistencyReport } from "../src/lib/nominee-consistency-store";
import { listNomineePageEntries } from "../src/lib/nominee-workflows-store";

async function main() {
  const report = await getNomineeConsistencyReport();
  const nominees = await listFormSubmissions(FORM_TYPES.nominees);
  const pages = await listNomineePageEntries();

  const publishedPages = pages.filter((p) => p.publishToNomineePage && p.status === "Published");
  const publishedIds = new Set(publishedPages.map((p) => p.nomineeId));

  const placeholders = nominees.filter((n) => {
    const payload = n.payload as { name?: string };
    return payload.name?.startsWith("Name needed");
  });

  const unpublishedInHq = nominees.filter((n) => n.external_id && !publishedIds.has(n.external_id));

  console.log("=== Consistency Report ===");
  console.log(`HQ nominees: ${report.nomineeCount}`);
  console.log(`Published on site: ${report.publishedPageEntryCount}`);
  console.log(`Orphans (site without HQ): ${report.orphanPublishedCount}`);
  console.log(`Placeholders needing names: ${placeholders.length}`);
  console.log(`HQ nominees not published: ${unpublishedInHq.length}`);

  if (placeholders.length) {
    console.log("\n=== Placeholders to rename in HQ ===");
    for (const n of placeholders) {
      const payload = n.payload as { name?: string; categoryId?: string };
      console.log(`  ${payload.name} (${n.external_id}) — category ${payload.categoryId}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
