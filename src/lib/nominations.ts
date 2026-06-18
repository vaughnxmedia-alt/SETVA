export type NominationCategory = {
  id: string;
  title: string;
  videoSrc: string;
  imageSrcs: string[];
};

function nominationImages(folder: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    return `/nominations/${folder}/${index + 1}.webp`;
  });
}

export const nominationsHeroVideo = "/nominations/hero/intro.mp4";

export const nominationCategories: NominationCategory[] = [
  {
    id: "artist-of-the-year",
    title: "Artist of the Year",
    videoSrc: "/nominations/artist-of-the-year/video.mp4",
    imageSrcs: nominationImages("artist-of-the-year", 8),
  },
  {
    id: "album-of-the-year",
    title: "Album of the Year",
    videoSrc: "/nominations/album-of-the-year/video.mp4",
    imageSrcs: nominationImages("album-of-the-year", 5),
  },
  {
    id: "band-of-the-year",
    title: "Band of the Year",
    videoSrc: "/nominations/band-of-the-year/video.mp4",
    imageSrcs: nominationImages("band-of-the-year", 4),
  },
  {
    id: "best-collaboration",
    title: "Best Collaboration",
    videoSrc: "/nominations/best-collaboration/video.mp4",
    imageSrcs: nominationImages("best-collaboration", 6),
  },
  {
    id: "breakthrough-artist-of-the-year",
    title: "Breakthrough Artist of the Year",
    videoSrc: "/nominations/breakthrough-artist-of-the-year/video.mp4",
    imageSrcs: nominationImages("breakthrough-artist-of-the-year", 8),
  },
];
