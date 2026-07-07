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

const DUPLICATE_TO_CANONICAL: Record<string, string> = {
  "category-1782682546211": "album-of-the-year",
  "category-1782682577649": "artist-of-the-year",
  "category-1782682612256": "band-of-the-year",
  "category-1782682635800": "best-collaboration",
  "category-1782683090720": "breakthrough-artist-of-the-year",
};

const DELETE_CATEGORY_IDS = new Set([
  ...Object.keys(DUPLICATE_TO_CANONICAL),
  "category-1782682373141", // Best Radio Host
  "category-1782682494024", // Radio Station of the Year
  "category-1782684139277", // Song of the Year
  "category-1782683065388", // Best Visual Effects (Music / Video)
]);

const CANONICAL_MUSIC_TITLES: Record<string, string> = {
  "artist-of-the-year": "Music: Artist of the Year",
  "album-of-the-year": "Music: Album of the Year",
  "band-of-the-year": "Music: Band of the Year",
  "best-collaboration": "Music: Best Collaboration",
  "breakthrough-artist-of-the-year": "Music: Breakthrough Artist of the Year",
};

const TALK_SHOW_ID = "category-1782682397412";

async function main() {
  const { listNomineeCategories, saveNomineeCategories } = await import(
    "../src/lib/nominee-categories-store"
  );
  const { listNominees, updateNominee } = await import("../src/lib/nominees-store");

  const categories = await listNomineeCategories();
  const nominees = await listNominees();

  let migratedNominees = 0;
  let orphanedNominees = 0;

  for (const nominee of nominees) {
    const targetId = DUPLICATE_TO_CANONICAL[nominee.categoryId];
    if (targetId) {
      await updateNominee({ ...nominee, categoryId: targetId });
      migratedNominees += 1;
      continue;
    }
    if (DELETE_CATEGORY_IDS.has(nominee.categoryId)) {
      orphanedNominees += 1;
    }
  }

  const nextCategories = categories
    .filter((category) => !DELETE_CATEGORY_IDS.has(category.id))
    .map((category) => {
      if (category.id === TALK_SHOW_ID) {
        return {
          ...category,
          title: "Special: Best Talk Show",
          videoUrl: "",
          videoPosterUrl: "",
          publishVideo: false,
          status: "Draft" as const,
        };
      }

      const musicTitle = CANONICAL_MUSIC_TITLES[category.id];
      if (musicTitle) {
        return { ...category, title: musicTitle };
      }

      return category;
    })
    .map((category, index) => ({ ...category, sortOrder: index }));

  const saved = await saveNomineeCategories(nextCategories);

  console.log(`Saved ${saved.length} categories.`);
  console.log(`Removed ${DELETE_CATEGORY_IDS.size} categories.`);
  console.log(`Migrated ${migratedNominees} nominee(s) from duplicate music categories.`);
  if (orphanedNominees > 0) {
    console.log(
      `${orphanedNominees} nominee(s) remain on deleted categories and will show as Unassigned in HQ.`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
