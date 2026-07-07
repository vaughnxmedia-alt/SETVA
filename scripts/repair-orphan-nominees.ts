import { getNomineeConsistencyReport, recoverOrphanPublishedNominees } from "../src/lib/nominee-consistency-store";

async function main() {
  const before = await getNomineeConsistencyReport();
  console.log(`Before: ${before.orphanPublishedCount} orphan published entries`);

  const result = await recoverOrphanPublishedNominees();
  console.log(`Restored: ${result.restored}`);
  for (const detail of result.details) {
    console.log(` - ${detail}`);
  }

  const after = await getNomineeConsistencyReport();
  console.log(`After: ${after.orphanPublishedCount} orphan published entries`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
