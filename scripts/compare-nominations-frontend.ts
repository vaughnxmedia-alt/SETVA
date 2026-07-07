/**
 * Compare HQ nominee/category state vs what appears on /nominations.
 *
 * Frontend rules (listPublishedNomineePageCategories):
 * - Category appears only if it has ≥1 published nominee WITH a graphic
 * - Category video shows only if category.publishVideo && category.videoUrl
 * - Nominees never have their own video — only the category can
 */
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

function hasCategoryVideo(category: {
  videoUrl: string;
  publishVideo: boolean;
}): boolean {
  return Boolean(category.publishVideo && category.videoUrl?.trim());
}

async function main() {
  const { listNomineeCategories } = await import("../src/lib/nominee-categories-store");
  const { listNominees } = await import("../src/lib/nominees-store");
  const { listNomineePageEntries, listPublishedNomineePageCategories } = await import(
    "../src/lib/nominee-workflows-store"
  );
  const { categoryIsSpecialAward } = await import("../src/lib/nominee-category-groups");

  const categories = (await listNomineeCategories()).filter((c) => c.active);
  const nominees = await listNominees();
  const entries = await listNomineePageEntries();
  const publicCategories = await listPublishedNomineePageCategories();

  const publicById = new Map(publicCategories.map((c) => [c.id, c]));
  const entryByNominee = new Map(entries.map((e) => [e.nomineeId, e]));

  type Row = {
    categoryId: string;
    title: string;
    group: string;
    onFrontend: boolean;
    categoryVideoLive: boolean;
    categoryVideoDraft: boolean;
    categoryPublished: boolean;
    nomineesTotal: number;
    withGraphic: number;
    publishedWithGraphic: number;
    onFrontendNominees: number;
    missingFromFrontend: string[];
    readyToPublish: string[];
  };

  const rows: Row[] = [];

  for (const category of categories.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const title = category.title;
    const group = title.startsWith("Special:")
      ? "Special"
      : title.startsWith("Music:")
        ? "Music"
        : title.startsWith("Business:")
          ? "Business"
          : title.startsWith("Creative:")
            ? "Creative"
            : title.startsWith("Film / Media:")
              ? "Film / Media"
              : "Other";

    const catNominees = nominees.filter((n) => n.categoryId === category.id);
    const withGraphic = catNominees.filter((n) => {
      const e = entryByNominee.get(n.id);
      return Boolean(e?.nomineeGraphicUrl?.trim() || e?.nomineeGraphicMediaId);
    });
    const publishedWithGraphic = catNominees.filter((n) => {
      const e = entryByNominee.get(n.id);
      return Boolean(
        e?.publishToNomineePage &&
          e.status === "Published" &&
          (e.nomineeGraphicUrl?.trim() || e.nomineeGraphicMediaId),
      );
    });

    const publicCat = publicById.get(category.id);
    const onFrontendNomineeIds = new Set(publicCat?.nominees.map((n) => n.nomineeId) ?? []);

    const missingFromFrontend: string[] = [];
    const readyToPublish: string[] = [];

    for (const nominee of catNominees) {
      const e = entryByNominee.get(nominee.id);
      const hasGraphic = Boolean(e?.nomineeGraphicUrl?.trim() || e?.nomineeGraphicMediaId);
      const isPublished = Boolean(e?.publishToNomineePage && e.status === "Published");

      if (isPublished && hasGraphic && !onFrontendNomineeIds.has(nominee.id)) {
        missingFromFrontend.push(`${nominee.name} (published but not on site?)`);
      } else if (hasGraphic && !isPublished) {
        readyToPublish.push(nominee.name);
      } else if (!hasGraphic && catNominees.length > 0) {
        // only list if category has nominees at all
      }
    }

    const videoUrl = category.videoUrl?.trim();
    const hasVideoFile = Boolean(videoUrl);
    const videoLive = hasCategoryVideo(category);
    const videoDraft = hasVideoFile && !category.publishVideo;

    rows.push({
      categoryId: category.id,
      title,
      group,
      onFrontend: Boolean(publicCat),
      categoryVideoLive: videoLive,
      categoryVideoDraft: videoDraft,
      categoryPublished: category.status === "Published",
      nomineesTotal: catNominees.length,
      withGraphic: withGraphic.length,
      publishedWithGraphic: publishedWithGraphic.length,
      onFrontendNominees: publicCat?.nominees.length ?? 0,
      missingFromFrontend,
      readyToPublish,
    });
  }

  console.log("\n=== SETVA: HQ vs /nominations (frontend) ===\n");
  console.log(
    "Rules: Categories get videos. Nominees get graphics only.",
  );
  console.log(
    "Frontend shows a category only when ≥1 nominee is Published + has a graphic.\n",
  );

  const onFront = rows.filter((r) => r.onFrontend);
  const notOnFront = rows.filter((r) => !r.onFrontend && r.nomineesTotal > 0);
  const noNominees = rows.filter((r) => r.nomineesTotal === 0);

  console.log(`--- ON FRONTEND (${onFront.length} categories) ---`);
  for (const r of onFront) {
    const video = r.categoryVideoLive ? "video LIVE" : r.categoryVideoDraft ? "video draft" : "no video";
    console.log(
      `  ${r.title} | ${r.onFrontendNominees}/${r.nomineesTotal} nominees live | ${video}`,
    );
  }

  console.log(`\n--- IN HQ, NOT ON FRONTEND (${notOnFront.length} categories with nominees) ---`);
  for (const r of notOnFront) {
    const video = r.categoryVideoLive
      ? "video LIVE"
      : r.categoryVideoDraft
        ? "video uploaded (not published)"
        : "no category video";
    const graphics = `${r.withGraphic}/${r.nomineesTotal} have graphics`;
    const published = `${r.publishedWithGraphic} published`;
    console.log(`\n  ${r.title}`);
    console.log(`    ${video} | ${graphics} | ${published} on site`);
    if (r.readyToPublish.length) {
      console.log(`    Ready to publish (${r.readyToPublish.length}): ${r.readyToPublish.slice(0, 5).join(", ")}${r.readyToPublish.length > 5 ? "…" : ""}`);
    }
    const needGraphics = r.nomineesTotal - r.withGraphic;
    if (needGraphics > 0) {
      console.log(`    Need graphics: ${needGraphics} nominee(s)`);
    }
    if (!r.categoryVideoDraft && !r.categoryVideoLive && r.withGraphic > 0) {
      console.log(`    Has nominee graphics but no category video`);
    }
    if (r.categoryVideoDraft && r.withGraphic === 0) {
      console.log(`    Has category video but no nominee graphics yet`);
    }
  }

  console.log(`\n--- NO NOMINEES IN HQ (${noNominees.length} categories) ---`);
  for (const r of noNominees) {
    const video = r.categoryVideoDraft || r.categoryVideoLive ? "has video" : "no video";
    console.log(`  ${r.title} (${video})`);
  }

  const videoNoGraphics = rows.filter(
    (r) => (r.categoryVideoDraft || r.categoryVideoLive) && r.withGraphic === 0 && r.nomineesTotal > 0,
  );
  const graphicsNoVideo = rows.filter(
    (r) => r.withGraphic > 0 && !r.categoryVideoDraft && !r.categoryVideoLive && r.nomineesTotal > 0,
  );
  const onFrontNoVideo = onFront.filter((r) => !r.categoryVideoLive);

  console.log("\n=== GAP SUMMARY ===");
  console.log(`Frontend categories: ${onFront.length}`);
  console.log(`HQ categories with nominees, not on frontend: ${notOnFront.length}`);
  console.log(`Categories with video but zero nominee graphics: ${videoNoGraphics.length}`);
  console.log(`Categories with nominee graphics but no video: ${graphicsNoVideo.length}`);
  console.log(`On frontend but category video not live: ${onFrontNoVideo.length}`);

  if (videoNoGraphics.length) {
    console.log("\nVideo but no graphics:");
    for (const r of videoNoGraphics) console.log(`  - ${r.title} (${r.nomineesTotal} nominees)`);
  }
  if (graphicsNoVideo.length) {
    console.log("\nGraphics but no category video:");
    for (const r of graphicsNoVideo) console.log(`  - ${r.title} (${r.withGraphic}/${r.nomineesTotal} graphics)`);
  }
  if (onFrontNoVideo.length) {
    console.log("\nLive on site without category video:");
    for (const r of onFrontNoVideo)
      console.log(`  - ${r.title} (${r.onFrontendNominees} nominees visible)`);
  }

  const totalNominees = nominees.length;
  const totalGraphics = nominees.filter((n) => {
    const e = entryByNominee.get(n.id);
    return Boolean(e?.nomineeGraphicUrl?.trim() || e?.nomineeGraphicMediaId);
  }).length;
  const totalPublished = nominees.filter((n) => {
    const e = entryByNominee.get(n.id);
    return Boolean(e?.publishToNomineePage && e.status === "Published");
  }).length;
  const totalOnFront = publicCategories.reduce((sum, c) => sum + c.nominees.length, 0);

  console.log("\n=== TOTALS ===");
  console.log(`Nominees in HQ: ${totalNominees}`);
  console.log(`With graphics (any status): ${totalGraphics}`);
  console.log(`Published to nominee page: ${totalPublished}`);
  console.log(`Visible on /nominations: ${totalOnFront}`);
  console.log(
    `Categories with video file: ${rows.filter((r) => r.categoryVideoDraft || r.categoryVideoLive).length}`,
  );
  console.log(
    `Categories with video LIVE on site: ${rows.filter((r) => r.categoryVideoLive).length}`,
  );

  console.log("\n--- LIVE SITE: nominees in HQ but hidden ---");
  for (const r of onFront) {
    const catNominees = nominees.filter((n) => n.categoryId === r.categoryId);
    const publicCat = publicById.get(r.categoryId)!;
    const onIds = new Set(publicCat.nominees.map((n) => n.nomineeId));
    const hidden = catNominees.filter((n) => !onIds.has(n.id));
    if (hidden.length === 0) continue;
    console.log(`\n  ${r.title}`);
    for (const n of hidden) {
      const e = entryByNominee.get(n.id);
      const hasGraphic = Boolean(e?.nomineeGraphicUrl?.trim() || e?.nomineeGraphicMediaId);
      const isPublished = Boolean(e?.publishToNomineePage && e.status === "Published");
      const reason = !hasGraphic
        ? "needs graphic"
        : !isPublished
          ? "has graphic, not published"
          : "unknown";
      console.log(`    - ${n.name} (${reason})`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
