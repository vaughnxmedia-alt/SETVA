/**
 * Remove duplicate orphan placeholder from Visionary Stewardship.
 * Pastor John Adolph (nom_1782767557219_8524afe4) is the real published awardee with graphic.
 */
import { FORM_TYPES, listFormSubmissions } from "../src/lib/form-submissions";
import { deleteNominee } from "../src/lib/nominees-store";
import { deleteNomineePageEntry, listNomineePageEntries } from "../src/lib/nominee-workflows-store";

const PLACEHOLDER_ID = "nom_1782817185152_d2bd8c20";

async function main() {
  const apply = process.argv.includes("--apply");
  const nominees = await listFormSubmissions(FORM_TYPES.nominees);
  const placeholder = nominees.find((n) => n.external_id === PLACEHOLDER_ID);
  const entries = await listNomineePageEntries();
  const pageEntry = entries.find((e) => e.nomineeId === PLACEHOLDER_ID);

  console.log("Placeholder nominee:", placeholder ? (placeholder.payload as { name?: string }).name : "not found");
  console.log("Page entry:", pageEntry?.id ?? "not found", pageEntry?.status, pageEntry?.publishToNomineePage);

  if (!apply) {
    console.log("\nDry run — re-run with --apply to delete placeholder nominee + page entry.");
    return;
  }

  if (pageEntry) {
    await deleteNomineePageEntry(pageEntry.id);
    console.log("Deleted page entry", pageEntry.id);
  }

  await deleteNominee(PLACEHOLDER_ID);
  console.log("Deleted nominee", PLACEHOLDER_ID);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
