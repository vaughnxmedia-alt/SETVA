import { getNomineeVoteTallies } from "../src/lib/votes-store.ts";
import { listNominees } from "../src/lib/nominees-store.ts";
import { listNomineeCategories } from "../src/lib/nominee-categories-store.ts";

async function main() {
  const t0 = Date.now();
  const [tallies, nominees, categories] = await Promise.all([
    getNomineeVoteTallies(),
    listNominees(),
    listNomineeCategories(),
  ]);

  const byCat = new Map<
    string,
    { title: string; total: number; rows: { name: string; votes: number }[] }
  >();

  for (const n of nominees) {
    const votes = tallies[n.id] ?? 0;
    const title = categories.find((c) => c.id === n.categoryId)?.title ?? n.categoryId;
    if (!byCat.has(n.categoryId)) {
      byCat.set(n.categoryId, { title, total: 0, rows: [] });
    }
    const section = byCat.get(n.categoryId)!;
    section.total += votes;
    section.rows.push({ name: n.name, votes });
  }

  const sections = [...byCat.values()]
    .map((s) => ({
      title: s.title,
      total: s.total,
      winner: s.rows.sort((a, b) => b.votes - a.votes)[0],
    }))
    .sort((a, b) => b.total - a.total);

  console.log(
    JSON.stringify(
      {
        ms: Date.now() - t0,
        nomineesWithCounts: Object.keys(tallies).length,
        grandTotal: Object.values(tallies).reduce((a, b) => a + b, 0),
        categories: sections.length,
        top: sections.slice(0, 5),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
