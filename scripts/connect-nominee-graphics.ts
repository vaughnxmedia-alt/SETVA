import { resolve } from "path";
import { readFileSync } from "fs";

function loadEnv() {
  const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const GRAPHICS_DIR = "/Users/juss/Downloads/Nominees";
const APPLY = process.argv.includes("--apply");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }
  return String(error);
}

// Category IDs (from live DB)
const CAT = {
  songwriter: "category-1782683024321", // Music: Best Song Writer
  producer: "category-1782682838996", // Music: Best Music Producer
  gospel: "category-1782682665068", // Music: Best Gospel Artist
  altpop: "category-1782683948451", // Music: Alternative Pop Artist of the Year
  latino: "category-1782682824263", // Music: Best Latino Artist
  musicvideo: "category-1782682864205", // Music: Best Music Video
  rnb: "category-1782682876749", // Music: Best R&B / Soul Artist
  dj: "category-1782683107545", // Music: DJ of the Year
  hiphop: "category-1782682778876", // Music: Best Hip Hop / Rap Artist
  creativeProject: "category-1782684614946", // Special: Creative Project of the Year
  pillars: "category-1782685465465", // Special: Pillars of Southeast Texas
  architect: "category-1782685453967", // Special: Musical Architect of the Year
  heartOfService: "category-1782685485844", // Special: Visionary Heart of Service
  stewardship: "category-1782685636735", // Special: Visionary Stewardship
  communityLeader: "category-1782684367999", // Special: Community Leader of the Year
  lifetime: "category-1782685436040", // Special: Lifetime Achievement Award
  visionaryOfYear: "category-1782685501832", // Special: Visionary of the Year
  youthImpact: "category-1782685661520", // Special: Youth Impact Award
  legacy: "category-1782685406045", // Special: Legacy Award
} as const;

type Row = {
  file: string;
  categoryId: string;
  label: string; // OCR'd name on the graphic
  nomineeId?: string; // existing nominee to attach to
  newName?: string; // create a new nominee with this name
};

// file -> nominee mapping (nomineeId from live DB; newName => create record)
const ROWS: Row[] = [
  // Music: Best Song Writer
  { file: "IMG_7950.PNG", categoryId: CAT.songwriter, label: "MzzButta Babii", nomineeId: "nom_1782818893428_ef5f003c" },
  { file: "IMG_7951.PNG", categoryId: CAT.songwriter, label: "Benzo Trill", nomineeId: "nom_1782820370130_2811ef65" },
  { file: "IMG_7952.PNG", categoryId: CAT.songwriter, label: "Jaye Biggs", nomineeId: "nom_1782818914220_d1e6de8a" },
  { file: "IMG_7953.PNG", categoryId: CAT.songwriter, label: "Jael Moody", newName: "Jael Moody" },
  { file: "IMG_7954.PNG", categoryId: CAT.songwriter, label: "Billi Gates", nomineeId: "nom_1782818945772_1e287113" },
  { file: "IMG_7955.PNG", categoryId: CAT.songwriter, label: "NuSoul", newName: "NuSoul" },
  { file: "IMG_7956.PNG", categoryId: CAT.songwriter, label: "Albee", nomineeId: "nom_1782819004788_91af5bff" },
  { file: "IMG_7957.PNG", categoryId: CAT.songwriter, label: "Micah Tyler", nomineeId: "nom_1782820278382_d3ed69a9" },
  { file: "IMG_7958.PNG", categoryId: CAT.songwriter, label: "Rose Gold", newName: "Rose Gold" },

  // Music: Best Music Producer (cards say Sound Engineer/Music Producer)
  { file: "IMG_7959.PNG", categoryId: CAT.producer, label: "FATondaBEAT", nomineeId: "nom_1782815760356_62e60a40" },
  { file: "IMG_7960.PNG", categoryId: CAT.producer, label: "LOSMUSICK", nomineeId: "nom_1782815712034_fe9c68a5" },
  { file: "IMG_7961.PNG", categoryId: CAT.producer, label: "Dead Raven", nomineeId: "nom_1782815681350_21085056" },
  { file: "IMG_7962.PNG", categoryId: CAT.producer, label: "K-$hellz", nomineeId: "nom_1782815794838_aab80f07" },
  { file: "IMG_7963.PNG", categoryId: CAT.producer, label: "DJ R3DD", nomineeId: "nom_1782815949882_dd251644" },
  { file: "IMG_7964.PNG", categoryId: CAT.producer, label: "Payton Sensei", nomineeId: "nom_1782815821997_f49ff59b" },
  { file: "IMG_7965.PNG", categoryId: CAT.producer, label: "Janae Monique", nomineeId: "nom_1782815996490_7a427974" },
  { file: "IMG_7966.PNG", categoryId: CAT.producer, label: "DJ B-DO", nomineeId: "nom_1782815924589_5b3a201e" },
  { file: "IMG_7967.PNG", categoryId: CAT.producer, label: "HiiiCoop", nomineeId: "nom_1782815875360_b61aa8dd" },

  // Music: Best Gospel Artist
  { file: "IMG_7969.PNG", categoryId: CAT.gospel, label: "Clint Mann", nomineeId: "nom_1782767262767_bee905d1" },
  { file: "IMG_7970.PNG", categoryId: CAT.gospel, label: "Chris Jones", nomineeId: "nom_1782767408804_158ff01b" },
  { file: "IMG_7971.PNG", categoryId: CAT.gospel, label: "Jael Moody", nomineeId: "nom_1782766767039_6aa4fe89" },
  { file: "IMG_7972.PNG", categoryId: CAT.gospel, label: "Micah Tyler", nomineeId: "nom_1782766734945_69c6270a" },
  { file: "IMG_7973.PNG", categoryId: CAT.gospel, label: "Denzel Rushun", nomineeId: "nom_1782767105228_b4674ee5" },

  // Special: Creative Project of the Year
  { file: "IMG_7974.PNG", categoryId: CAT.creativeProject, label: "Whip The Rapper (409 Cypher)", nomineeId: "nom_1782817418759_209eac93" },

  // Special: Pillars of Southeast Texas (Visionary Pillar)
  { file: "IMG_7975.PNG", categoryId: CAT.pillars, label: "Zena Stephens", newName: "Zena Stephens" },
  { file: "IMG_7977.PNG", categoryId: CAT.pillars, label: "Bradford Coleman", nomineeId: "nom_1782817379618_bc09a186" },
  { file: "IMG_7978.PNG", categoryId: CAT.pillars, label: "Joe Tant", nomineeId: "nom_1782817738416_d3e99b92" },
  { file: "IMG_7979.PNG", categoryId: CAT.pillars, label: "Dr Freddie Titus", newName: "Dr Freddie Titus" },

  // Special: Musical Architect of the Year (Visionary Architect Award)
  { file: "IMG_7976.PNG", categoryId: CAT.architect, label: "Kenneth Turner", nomineeId: "nom_1782817333885_ea9cd76c" },

  // Special: Visionary Heart of Service
  { file: "IMG_7980.PNG", categoryId: CAT.heartOfService, label: "Patrina Gallow", nomineeId: "nom_1782817202254_efe1546f" },

  // Special: Visionary Stewardship
  { file: "IMG_7981.PNG", categoryId: CAT.stewardship, label: "Pastor John Adolph", nomineeId: "nom_1782817185152_d2bd8c20" },

  // Music: Alternative Pop Artist of the Year
  { file: "IMG_7982.PNG", categoryId: CAT.altpop, label: "Sammy Elo", nomineeId: "nom_1782819381866_8053e3d0" },
  { file: "IMG_7983.PNG", categoryId: CAT.altpop, label: "Royce Jakobs", nomineeId: "nom_1782819764327_ba75486f" },
  { file: "IMG_7984.PNG", categoryId: CAT.altpop, label: "Sancho Baker", nomineeId: "nom_1782819450432_ecc376dc" },
  { file: "IMG_7985.PNG", categoryId: CAT.altpop, label: "Strongest Man Alive", nomineeId: "nom_1782819413926_fe15756a" },
  { file: "IMG_7986.PNG", categoryId: CAT.altpop, label: "Teezo Touchdown", nomineeId: "nom_1782819360431_2e6497e2" },

  // Music: Best Latino Artist
  { file: "IMG_7987.PNG", categoryId: CAT.latino, label: "Los Chavalos De Oro", nomineeId: "nom_1782767805178_48e00928" },
  { file: "IMG_7988.PNG", categoryId: CAT.latino, label: "Ozeeck Madafaka", nomineeId: "nom_1782768184138_e973e6b3" },
  { file: "IMG_7989.PNG", categoryId: CAT.latino, label: "Strongest Man Alive", nomineeId: "nom_1782767952474_4ac2c0f7" },
  { file: "IMG_7990.PNG", categoryId: CAT.latino, label: "Phil Thee", nomineeId: "nom_1782768136670_f08174ac" },
  { file: "IMG_7991.PNG", categoryId: CAT.latino, label: "Erasmo", nomineeId: "nom_1782768094590_1c46bb21" },

  // Music: Best Music Video (IMG_7997 is a duplicate of 7996, skipped)
  { file: "IMG_7992.PNG", categoryId: CAT.musicvideo, label: "Al Bee", nomineeId: "nom_1782818439781_9f8cac9b" },
  { file: "IMG_7993.PNG", categoryId: CAT.musicvideo, label: "DJ R3DD", nomineeId: "nom_1782817871491_72e8a61b" },
  { file: "IMG_7994.PNG", categoryId: CAT.musicvideo, label: "Rose Gold", nomineeId: "nom_1782817909066_1d640fc8" },
  { file: "IMG_7995.PNG", categoryId: CAT.musicvideo, label: "Jaye Biggs", nomineeId: "nom_1782818417795_6559604f" },
  { file: "IMG_7996.PNG", categoryId: CAT.musicvideo, label: "Benzo Trill", nomineeId: "nom_1782818527988_e679bfc0" },
  { file: "IMG_7998.PNG", categoryId: CAT.musicvideo, label: "Teezo Touchdown", nomineeId: "nom_1782818485935_4806de30" },

  // Special: Community Leader of the Year
  { file: "IMG_7999.PNG", categoryId: CAT.communityLeader, label: "Raymond & Stacy Louis", newName: "Raymond & Stacy Louis" },

  // Special: Lifetime Achievement Award
  { file: "IMG_8001.PNG", categoryId: CAT.lifetime, label: "Benjamin Ben Collins Sr", nomineeId: "nom_1782817255588_9bd29790" },

  // Special: Visionary of the Year
  { file: "IMG_8002.PNG", categoryId: CAT.visionaryOfYear, label: "Quin Gregory", nomineeId: "nom_1782817779093_0e5e3a9e" },

  // Special: Youth Impact Award
  { file: "IMG_8003.PNG", categoryId: CAT.youthImpact, label: "One Nation of Southeast Texas", nomineeId: "nom_1782767501801_535681c6" },

  // Special: Legacy Award
  { file: "IMG_8004.PNG", categoryId: CAT.legacy, label: "Barbara Lynn", nomineeId: "nom_1782741423934_f8c6a4b1" },

  // Music: Best R&B / Soul Artist
  { file: "IMG_8005.PNG", categoryId: CAT.rnb, label: "DJ R3DD", nomineeId: "nom_1782818808486_c9776223" },
  { file: "IMG_8006.PNG", categoryId: CAT.rnb, label: "Nu Soul", nomineeId: "nom_1782818839446_e4322366" },
  { file: "IMG_8007.PNG", categoryId: CAT.rnb, label: "Deandre Nico", nomineeId: "nom_1782818757371_8dd879ec" },
  { file: "IMG_8008.PNG", categoryId: CAT.rnb, label: "Benzo Trill", nomineeId: "nom_1782818652707_84fc1cff" },
  { file: "IMG_8009.PNG", categoryId: CAT.rnb, label: "DC", nomineeId: "nom_1782818716106_bc82c1fa" },
  { file: "IMG_8010.PNG", categoryId: CAT.rnb, label: "Soul Sistuh", nomineeId: "nom_1782818680807_bf24f59e" },

  // Music: DJ of the Year
  { file: "IMG_8011.PNG", categoryId: CAT.dj, label: "DJ Deewayy", nomineeId: "nom_1782819163804_31a158c6" },
  { file: "IMG_8012.PNG", categoryId: CAT.dj, label: "DJ EChill", nomineeId: "nom_1782819179729_85478b1e" },
  { file: "IMG_8013.PNG", categoryId: CAT.dj, label: "DJ Decarlos", nomineeId: "nom_1782819216190_dcda2362" },
  { file: "IMG_8014.PNG", categoryId: CAT.dj, label: "DJ TJObviously", newName: "DJ TJObviously" },
  { file: "IMG_8015.PNG", categoryId: CAT.dj, label: "DJ Dews", nomineeId: "nom_1782819194063_9b0f6ec3" },
  { file: "IMG_8016.PNG", categoryId: CAT.dj, label: "DJ Best Wave", nomineeId: "nom_1782819132592_3b59de44" },
  { file: "IMG_8017.PNG", categoryId: CAT.dj, label: "DJ Kenia", nomineeId: "nom_1782819149335_bfd00b33" },

  // Music: Best Hip Hop / Rap Artist
  { file: "IMG_8018.PNG", categoryId: CAT.hiphop, label: "Southsid3", nomineeId: "nom_1782768929474_a21e8388" },
  { file: "IMG_8019.PNG", categoryId: CAT.hiphop, label: "Tum Trapper", nomineeId: "nom_1782779675051_e29edfc1" },
  { file: "IMG_8020.PNG", categoryId: CAT.hiphop, label: "Whip The Rapper", nomineeId: "nom_1782768965689_a2c50793" },
  { file: "IMG_8021.PNG", categoryId: CAT.hiphop, label: "Jaye Biggs", nomineeId: "nom_1782778778553_8cb14de5" },
  { file: "IMG_8022.PNG", categoryId: CAT.hiphop, label: "Rose Gold", nomineeId: "nom_1782779838180_d3cd2a14" },
  { file: "IMG_8023.PNG", categoryId: CAT.hiphop, label: "Dead Raven", nomineeId: "nom_1782779804917_9a8be2fb" },
  { file: "IMG_8024.PNG", categoryId: CAT.hiphop, label: "Big Jade", nomineeId: "nom_1782779750110_10369c47" },
  { file: "IMG_8025.PNG", categoryId: CAT.hiphop, label: "Heavo", nomineeId: "nom_1782779613715_e2981144" },
  { file: "IMG_8026.PNG", categoryId: CAT.hiphop, label: "Albee", nomineeId: "nom_1782779707513_d877fc70" },
  { file: "IMG_8027.PNG", categoryId: CAT.hiphop, label: "Phil Thee", nomineeId: "nom_1782779641202_d23efb2c" },
  { file: "IMG_8028.PNG", categoryId: CAT.hiphop, label: "Clover G Boss", nomineeId: "nom_1782768907808_504e6c75" },
  { file: "IMG_8029.PNG", categoryId: CAT.hiphop, label: "Billi Gates", nomineeId: "nom_1782779547858_3fd9237f" },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const { upsertNominee, listNominees } = await import("../src/lib/nominees-store");
  const { writeNomineeGraphicFile } = await import("../src/lib/nomination-assets");
  const { listNomineePageEntries, saveNomineePageEntry } = await import(
    "../src/lib/nominee-workflows-store"
  );

  const existingNominees = new Set((await listNominees()).map((n) => n.id));
  const existingEntries = await listNomineePageEntries();
  const entryIdByNominee = new Map(existingEntries.map((e) => [e.nomineeId, e.id]));

  const addedBy = { name: "SETVA Graphic Connect", email: "seed@setvawards.com" };
  const displayOrderByCat: Record<string, number> = {};

  let connected = 0;
  let created = 0;
  const failures: string[] = [];

  for (const row of ROWS) {
    if (ONLY && row.file !== ONLY) continue;
    const filePath = resolve(GRAPHICS_DIR, row.file);
    try {
      let nomineeId = row.nomineeId;

      // Create new nominee record if needed
      if (!nomineeId && row.newName) {
        nomineeId = `nom_connect_${slugify(row.newName)}_${slugify(row.categoryId).slice(-6)}`;
        if (APPLY) {
          await upsertNominee(
            {
              name: row.newName,
              categoryId: row.categoryId,
              cityRegion: "",
              contactEmail: "",
              contactPhone: "",
              socialLinks: [],
              internalNotes: "Added from official SETVA nominee graphic.",
              confirmationStatus: "Pending",
            },
            nomineeId,
            addedBy,
          );
        }
        created += 1;
        console.log(`  + NEW nominee: ${row.newName}  (${nomineeId})`);
      }

      if (!nomineeId) {
        failures.push(`${row.file}: no nominee id resolved`);
        continue;
      }

      if (row.nomineeId && !existingNominees.has(row.nomineeId)) {
        failures.push(`${row.file}: nominee id ${row.nomineeId} not found in DB`);
        continue;
      }

      const order = (displayOrderByCat[row.categoryId] =
        (displayOrderByCat[row.categoryId] ?? 0) + 1);

      let graphicUrl = "(dry-run)";
      if (APPLY) {
        const buffer = readFileSync(filePath);
        graphicUrl = await writeNomineeGraphicFile({
          categoryId: row.categoryId,
          nomineeId,
          buffer,
          fileName: row.file,
        });

        const pageEntryId = entryIdByNominee.get(nomineeId) ?? `page_${nomineeId}`;
        await saveNomineePageEntry(
          {
            nomineeId,
            categoryId: row.categoryId,
            nomineeGraphicMediaId: "",
            nomineeGraphicUrl: graphicUrl,
            displayOrder: order,
            publishToNomineePage: true,
            status: "Published",
            createdByName: addedBy.name,
            createdByEmail: addedBy.email,
          },
          pageEntryId,
        );
      }

      connected += 1;
      console.log(`  ✓ ${row.file}  ->  ${row.label}  [order ${order}]  ${graphicUrl}`);
    } catch (error) {
      failures.push(`${row.file}: ${describeError(error)}`);
      console.error(`  ✗ ${row.file}: ${describeError(error)}`);
    }
  }

  console.log(
    `\n${APPLY ? "APPLIED" : "DRY RUN"} — connected ${connected}, new nominees ${created}, failures ${failures.length}`,
  );
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures) console.log("  - " + f);
  }
  if (!APPLY) console.log("\nRe-run with --apply to write to the database and upload graphics.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
