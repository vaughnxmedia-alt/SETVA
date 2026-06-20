import type { NomineeCategory } from "@/lib/nominees";
import type { PublicPageNomineeSeed } from "@/lib/nominee-public-page-seed";
import { seedNomineeId, seedPageEntryId } from "@/lib/nominee-public-page-seed";

function graphic(categoryId: string, index: number): string {
  return `/nominations/${categoryId}/${index}.png`;
}

/** Second batch from NOMINATION VIDEO-2 delivery. */
export const nominationBatch2Categories: NomineeCategory[] = [
  {
    id: "community-leader-of-the-year",
    title: "Community Leader of the Year",
    description: "",
    sortOrder: 100,
    status: "Published",
    videoMediaId: "",
    videoUrl: "/nominations/community-leader-of-the-year/video.mp4",
    publishVideo: true,
    active: true,
  },
  {
    id: "flava-band-of-the-year",
    title: "Flava Band of the Year",
    description: "",
    sortOrder: 101,
    status: "Published",
    videoMediaId: "",
    videoUrl: "",
    publishVideo: false,
    active: true,
  },
  {
    id: "legacy-award",
    title: "Legacy Award",
    description: "",
    sortOrder: 102,
    status: "Published",
    videoMediaId: "",
    videoUrl: "/nominations/legacy-award/video.mp4",
    publishVideo: true,
    active: true,
  },
  {
    id: "lifetime-achievement-award",
    title: "Life Time Achievement Award",
    description: "",
    sortOrder: 103,
    status: "Published",
    videoMediaId: "",
    videoUrl: "/nominations/lifetime-achievement-award/video.mp4",
    publishVideo: true,
    active: true,
  },
  {
    id: "visionary-of-the-year",
    title: "Visionary of the Year",
    description: "",
    sortOrder: 104,
    status: "Published",
    videoMediaId: "",
    videoUrl: "/nominations/visionary-of-the-year/video.mp4",
    publishVideo: true,
    active: true,
  },
  {
    id: "youth-impact-of-the-year",
    title: "Youth Impact of the Year",
    description: "",
    sortOrder: 105,
    status: "Published",
    videoMediaId: "",
    videoUrl: "/nominations/youth-impact-of-the-year/video.mp4",
    publishVideo: true,
    active: true,
  },
];

export const nominationBatch2NomineeSeed: PublicPageNomineeSeed[] = [
  {
    categoryId: "community-leader-of-the-year",
    displayOrder: 1,
    name: "Raymond Louis and Stacy Wagner Louis",
    graphicUrl: graphic("community-leader-of-the-year", 1),
  },
  {
    categoryId: "flava-band-of-the-year",
    displayOrder: 1,
    name: "The Flava Band",
    graphicUrl: graphic("flava-band-of-the-year", 1),
  },
  {
    categoryId: "legacy-award",
    displayOrder: 1,
    name: "Barbara Lynn",
    graphicUrl: graphic("legacy-award", 1),
  },
  {
    categoryId: "lifetime-achievement-award",
    displayOrder: 1,
    name: "Benjamin Ben Collins Sr",
    graphicUrl: graphic("lifetime-achievement-award", 1),
  },
  {
    categoryId: "visionary-of-the-year",
    displayOrder: 1,
    name: "Quin Gregory",
    graphicUrl: graphic("visionary-of-the-year", 1),
  },
  {
    categoryId: "youth-impact-of-the-year",
    displayOrder: 1,
    name: "One Nation of Southeast Texas",
    graphicUrl: graphic("youth-impact-of-the-year", 1),
  },
];

export function batch2SeedNomineeId(categoryId: string, displayOrder: number): string {
  return seedNomineeId(categoryId, displayOrder).replace("nom_seed_", "nom_seed2_");
}

export function batch2SeedPageEntryId(categoryId: string, displayOrder: number): string {
  return seedPageEntryId(categoryId, displayOrder).replace("nom_page_seed_", "nom_page_seed2_");
}
