/**
 * Delete orphan "Name needed (...)" placeholder nominees and their page entries.
 */
import { listNominees, deleteNominee } from "../src/lib/nominees-store";
import { deleteNomineePageEntry, listNomineePageEntries } from "../src/lib/nominee-workflows-store";

async function main() {
  const apply = process.argv.includes("--apply");
  const nominees = await listNominees();
  const pageEntries = await listNomineePageEntries();

  const placeholders = nominees.filter((nominee) => nominee.name.startsWith("Name needed"));

  console.log(`Found ${placeholders.length} placeholder nominee(s).`);

  for (const nominee of placeholders) {
    const linkedPages = pageEntries.filter((entry) => entry.nomineeId === nominee.id);
    console.log(`- ${nominee.name} (${nominee.id}) — ${linkedPages.length} page entr${linkedPages.length === 1 ? "y" : "ies"}`);
  }

  if (!apply) {
    console.log("\nDry run — re-run with --apply to delete.");
    return;
  }

  let deleted = 0;
  for (const nominee of placeholders) {
    for (const entry of pageEntries.filter((item) => item.nomineeId === nominee.id)) {
      await deleteNomineePageEntry(entry.id);
      console.log(`Deleted page entry ${entry.id}`);
    }

    const ok = await deleteNominee(nominee.id);
    if (ok) {
      deleted += 1;
      console.log(`Deleted nominee ${nominee.id}`);
    }
  }

  const remaining = (await listNominees()).filter((n) => n.name.startsWith("Name needed"));
  console.log(`\nDeleted ${deleted} placeholder(s). Remaining: ${remaining.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
