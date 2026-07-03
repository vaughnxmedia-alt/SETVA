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

async function main() {
  const { listNomineeCategories, saveNomineeCategories } = await import(
    "../src/lib/nominee-categories-store"
  );

  const before = await listNomineeCategories();
  const saved = await saveNomineeCategories(before);

  console.log("Top of categories page after reorder:");
  saved.slice(0, 10).forEach((c, i) => {
    const done =
      c.videoUrl && c.videoPosterUrl
        ? "COMPLETE"
        : c.videoUrl
          ? "video-only"
          : "—";
    console.log(`  ${i + 1}. ${c.title}  [${done}]`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
