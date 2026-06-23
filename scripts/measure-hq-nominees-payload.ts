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
    // .env.local optional for local-only runs
  }
}

loadEnvFile();

async function main() {
  const { listNominees } = await import("../src/lib/nominees-store");
  const {
    listNomineePageEntries,
    listNomineeMagazineArticles,
    listNomineeVotingSetups,
    getNomineePublishQueue,
  } = await import("../src/lib/nominee-workflows-store");
  const { listNomineeCategories, categoryTitleById } = await import(
    "../src/lib/nominee-categories-store"
  );

  const [nominees, categories, nomineePageEntries, magazineArticles, votingSetups, publishQueue] =
    await Promise.all([
      listNominees(),
      listNomineeCategories(),
      listNomineePageEntries(),
      listNomineeMagazineArticles(),
      listNomineeVotingSetups(),
      getNomineePublishQueue(),
    ]);

  const initialNominees = nominees.map((n) => ({
    ...n,
    categoryTitle: categoryTitleById(categories, n.categoryId),
  }));

  const payload = JSON.stringify({
    initialNominees,
    categories,
    nomineePageEntries,
    magazineArticles,
    votingSetups,
    publishQueue,
  });

  const mb = payload.length / 1024 / 1024;
  console.log(`payload bytes: ${payload.length.toLocaleString()} (${mb.toFixed(2)} MB)`);
  console.log(`nominees: ${nominees.length}, categories: ${categories.length}`);
  console.log(
    `page entries: ${nomineePageEntries.length}, magazine: ${magazineArticles.length}, voting: ${votingSetups.length}`,
  );

  let dataUrlCount = 0;
  let largestDataUrl = 0;
  let searchFrom = 0;
  while (true) {
    const start = payload.indexOf("data:image", searchFrom);
    if (start === -1) break;
    const end = payload.indexOf('"', start);
    const chunk = end === -1 ? payload.slice(start) : payload.slice(start, end);
    if (chunk.length > 100) {
      dataUrlCount += 1;
      largestDataUrl = Math.max(largestDataUrl, chunk.length);
    }
    searchFrom = start + 10;
  }
  console.log(`inline data:image URLs: ${dataUrlCount}`);
  if (largestDataUrl > 0) {
    console.log(`largest data URL length: ${largestDataUrl.toLocaleString()} chars`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
