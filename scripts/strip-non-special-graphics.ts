import { stripNonSpecialNomineeGraphics } from "../src/lib/nominee-workflows-store";

async function main() {
  const result = await stripNonSpecialNomineeGraphics();
  console.log("Strip non-Special nominee graphics:");
  console.log(`  Cleared: ${result.cleared}`);
  console.log(`  Kept (Special): ${result.kept}`);
  console.log(`  Unchanged: ${result.unchanged}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
