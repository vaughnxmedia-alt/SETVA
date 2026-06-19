import { nominationCategories } from "@/lib/nominations";
import type { NomineeCategory } from "@/lib/nominees";

export type PublicPageNomineeSeed = {
  categoryId: string;
  displayOrder: number;
  name: string;
  graphicUrl: string;
  workTitle?: string;
};

function graphic(categoryId: string, index: number): string {
  return `/nominations/${categoryId}/${index}.webp`;
}

/** Nominees currently shown on the public nominations page graphics. */
export const publicPageNomineeSeed: PublicPageNomineeSeed[] = [
  // Artist of the Year
  { categoryId: "artist-of-the-year", displayOrder: 1, name: "NuSoul", graphicUrl: graphic("artist-of-the-year", 1) },
  { categoryId: "artist-of-the-year", displayOrder: 2, name: "Albee", graphicUrl: graphic("artist-of-the-year", 2) },
  { categoryId: "artist-of-the-year", displayOrder: 3, name: "Billi Gates", graphicUrl: graphic("artist-of-the-year", 3) },
  { categoryId: "artist-of-the-year", displayOrder: 4, name: "Jaye Biggs", graphicUrl: graphic("artist-of-the-year", 4) },
  { categoryId: "artist-of-the-year", displayOrder: 5, name: "Clover G Boss", graphicUrl: graphic("artist-of-the-year", 5) },
  { categoryId: "artist-of-the-year", displayOrder: 6, name: "Chris Jones", graphicUrl: graphic("artist-of-the-year", 6) },
  { categoryId: "artist-of-the-year", displayOrder: 7, name: "MzzButtaBabii", graphicUrl: graphic("artist-of-the-year", 7) },
  { categoryId: "artist-of-the-year", displayOrder: 8, name: "Teezo Touchdown", graphicUrl: graphic("artist-of-the-year", 8) },

  // Album of the Year
  {
    categoryId: "album-of-the-year",
    displayOrder: 1,
    name: "Billi Gates",
    workTitle: "Inside the Registry: Dreams Never Die",
    graphicUrl: graphic("album-of-the-year", 1),
  },
  {
    categoryId: "album-of-the-year",
    displayOrder: 2,
    name: "Clover G Boss + Young Noble",
    workTitle: "Legacy",
    graphicUrl: graphic("album-of-the-year", 2),
  },
  {
    categoryId: "album-of-the-year",
    displayOrder: 3,
    name: "Soul Sistuh",
    workTitle: "The Road to Recovery",
    graphicUrl: graphic("album-of-the-year", 3),
  },
  {
    categoryId: "album-of-the-year",
    displayOrder: 4,
    name: "Nightboyz",
    workTitle: "Dead Raven",
    graphicUrl: graphic("album-of-the-year", 4),
  },
  {
    categoryId: "album-of-the-year",
    displayOrder: 5,
    name: "Jaye Biggs x B-Do",
    workTitle: "Trill Type",
    graphicUrl: graphic("album-of-the-year", 5),
  },

  // Band of the Year
  {
    categoryId: "band-of-the-year",
    displayOrder: 1,
    name: "NuSoul & Blacque Koffee",
    graphicUrl: graphic("band-of-the-year", 1),
  },
  { categoryId: "band-of-the-year", displayOrder: 2, name: "Hot Grits", graphicUrl: graphic("band-of-the-year", 2) },
  { categoryId: "band-of-the-year", displayOrder: 3, name: "Psycho Jenni", graphicUrl: graphic("band-of-the-year", 3) },
  { categoryId: "band-of-the-year", displayOrder: 4, name: "The Flava Band", graphicUrl: graphic("band-of-the-year", 4) },

  // Best Collaboration
  {
    categoryId: "best-collaboration",
    displayOrder: 1,
    name: "NuSoul ft Erika Johnson",
    workTitle: "Make Up Call",
    graphicUrl: graphic("best-collaboration", 1),
  },
  {
    categoryId: "best-collaboration",
    displayOrder: 2,
    name: "Big Jade ft Big Chyna",
    workTitle: "Not Like Us Freestyle",
    graphicUrl: graphic("best-collaboration", 2),
  },
  {
    categoryId: "best-collaboration",
    displayOrder: 3,
    name: "Jaye Biggs ft Bun B of UGK",
    workTitle: "Trill Type",
    graphicUrl: graphic("best-collaboration", 3),
  },
  {
    categoryId: "best-collaboration",
    displayOrder: 4,
    name: "Clover G Boss ft Z-Ro, Lil Flip, Big Shasta, DJ Kay Slay",
    workTitle: "I-10 Connected",
    graphicUrl: graphic("best-collaboration", 4),
  },
  {
    categoryId: "best-collaboration",
    displayOrder: 5,
    name: "Rose Gold ft Albee & Ethan Osborne",
    workTitle: "Country Boy",
    graphicUrl: graphic("best-collaboration", 5),
  },
  {
    categoryId: "best-collaboration",
    displayOrder: 6,
    name: "Albee ft Rose Gold",
    workTitle: "Wont Stop Cant Stop",
    graphicUrl: graphic("best-collaboration", 6),
  },

  // Breakthrough Artist of the Year
  {
    categoryId: "breakthrough-artist-of-the-year",
    displayOrder: 1,
    name: "MzzButtaBabii",
    graphicUrl: graphic("breakthrough-artist-of-the-year", 1),
  },
  {
    categoryId: "breakthrough-artist-of-the-year",
    displayOrder: 2,
    name: "Southsid3",
    graphicUrl: graphic("breakthrough-artist-of-the-year", 2),
  },
  {
    categoryId: "breakthrough-artist-of-the-year",
    displayOrder: 3,
    name: "DJR33D",
    graphicUrl: graphic("breakthrough-artist-of-the-year", 3),
  },
  {
    categoryId: "breakthrough-artist-of-the-year",
    displayOrder: 4,
    name: "Big Jade",
    graphicUrl: graphic("breakthrough-artist-of-the-year", 4),
  },
  {
    categoryId: "breakthrough-artist-of-the-year",
    displayOrder: 5,
    name: "StrongestManAlive",
    graphicUrl: graphic("breakthrough-artist-of-the-year", 5),
  },
  {
    categoryId: "breakthrough-artist-of-the-year",
    displayOrder: 6,
    name: "Shelby Williams",
    graphicUrl: graphic("breakthrough-artist-of-the-year", 6),
  },
  {
    categoryId: "breakthrough-artist-of-the-year",
    displayOrder: 7,
    name: "Sylvia The Poet",
    graphicUrl: graphic("breakthrough-artist-of-the-year", 7),
  },
  {
    categoryId: "breakthrough-artist-of-the-year",
    displayOrder: 8,
    name: "Clover G Boss",
    graphicUrl: graphic("breakthrough-artist-of-the-year", 8),
  },
];

export function publicPageNomineeCategories(): NomineeCategory[] {
  return nominationCategories.map((category, index) => ({
    id: category.id,
    title: category.title,
    description: "",
    sortOrder: index,
    status: "Published",
    videoMediaId: "",
    videoUrl: category.videoSrc,
    publishVideo: true,
    active: true,
  }));
}

export function seedNomineeId(categoryId: string, displayOrder: number): string {
  return `nom_seed_${categoryId}_${displayOrder}`;
}

export function seedPageEntryId(categoryId: string, displayOrder: number): string {
  return `nom_page_seed_${categoryId}_${displayOrder}`;
}
