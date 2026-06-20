import { resolve } from "path";
import { readFileSync } from "fs";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env.local");
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
}

loadEnvFile();

async function main() {
  const { seedNominationBatch2 } = await import("../src/lib/nomination-media-import-store");
  const result = await seedNominationBatch2({
    name: "SETVA Seed Script",
    email: "seed@setvawards.com",
  });
  console.log("Seeded nomination batch 2:", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
