import { describe, expect, it } from "vitest";
import {
  parseNominationMediaFiles,
  parseNominationMediaManifest,
  classifyNominationMediaFile,
  titleFromMediaFilename,
} from "@/lib/nomination-media-import";

describe("nomination media import", () => {
  it("classifies nomination delivery files", () => {
    expect(classifyNominationMediaFile("VISIONARY OF THE YEAR.mp4").kind).toBe("video");
    expect(classifyNominationMediaFile("VISIONARY.png").kind).toBe("image");
    expect(classifyNominationMediaFile("manifest.csv").kind).toBe("manifest");
  });

  it("auto-matches videos to graphics from delivery-style filenames", () => {
    const files = [
      "COMMUNITY LEADER OF THE YEAR.mp4",
      "COMUNITY LEADER.png",
      "VISIONARY OF THE YEAR.mp4",
      "VISIONARY.png",
      "YOUTH IMPACT AWARD.mp4",
      "YOUTH IMPACT OF THE YEAR .png",
      "FLAVA BAND OF THE YEAR.png",
    ].map(classifyNominationMediaFile);

    const parsed = parseNominationMediaFiles(files);
    const visionary = parsed.rows.find((row) => row.videoFileName.includes("VISIONARY OF THE YEAR"));
    const youth = parsed.rows.find((row) => row.videoFileName.includes("YOUTH IMPACT AWARD"));
    const flava = parsed.rows.find((row) => row.graphicFileName.includes("FLAVA"));

    expect(visionary?.graphicFileName).toBe("VISIONARY.png");
    expect(youth?.graphicFileName).toBe("YOUTH IMPACT OF THE YEAR .png");
    expect(flava?.categoryTitle).toContain("Flava");
  });

  it("parses manifest rows with explicit nominee names", () => {
    const manifest = [
      "Category,Category Video,Nominee Graphic,Nominee,Publish Category Video,Publish Nominee",
      'Legacy Award,LEGACY AWARD.mp4,LEGACY AWARD.png,Barbara Lynn,Yes,Yes',
    ].join("\n");

    const parsed = parseNominationMediaManifest(manifest, [
      classifyNominationMediaFile("LEGACY AWARD.mp4"),
      classifyNominationMediaFile("LEGACY AWARD.png"),
    ]);

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.nomineeName).toBe("Barbara Lynn");
    expect(parsed.rows[0]?.categoryTitle).toBe("Legacy Award");
  });

  it("formats category titles from media filenames", () => {
    expect(titleFromMediaFilename("VISIONARY OF THE YEAR.mp4")).toBe("Visionary of the Year");
    expect(titleFromMediaFilename("LEGACY AWARD.mp4")).toBe("Legacy Award");
  });
});
