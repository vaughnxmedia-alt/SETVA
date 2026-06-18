export type MagazineBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string };

export type MagazineArticle = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  publishedLabel: string;
  blocks: MagazineBlock[];
};

export const visionaryMagazine = {
  name: "Visionary Magazine",
  tagline: "Stories, announcements, and vision from across the 409.",
} as const;

export const magazineArticles: MagazineArticle[] = [
  {
    slug: "setva-returns-august-8-2026",
    title:
      "Southeast Texas Visionary Awards Returns August 8 to Celebrate Excellence Across the Region",
    excerpt:
      "SETVA returns to the Jefferson Theatre for an evening celebrating leaders, creatives, and changemakers across Southeast Texas.",
    publishedAt: "2026-06-18",
    publishedLabel: "June 18, 2026",
    blocks: [
      {
        type: "paragraph",
        text: "The Southeast Texas Visionary Awards (SETVA) will return on Saturday, August 8, 2026, bringing together community leaders, entrepreneurs, creatives, nonprofits, and changemakers for an evening dedicated to celebrating excellence throughout Southeast Texas.",
      },
      {
        type: "paragraph",
        text: "Held at the historic Jefferson Theatre in downtown Beaumont, the annual event recognizes individuals and organizations whose work continues to make a lasting impact across the region. From business and education to community service and culture, SETVA shines a spotlight on those helping shape the future of Southeast Texas.",
      },
      {
        type: "paragraph",
        text: "Created to honor visionaries and amplify stories that deserve recognition, the Southeast Texas Visionary Awards has become a celebration of leadership, innovation, and community pride.",
      },
      {
        type: "paragraph",
        text: "Additional announcements regarding award categories, nominees, sponsorship opportunities, volunteers, and special guests will be shared in the coming weeks.",
      },
      {
        type: "heading",
        text: "About SETVA",
      },
      {
        type: "paragraph",
        text: "The Southeast Texas Visionary Awards is an annual awards program dedicated to recognizing outstanding individuals, businesses, nonprofits, and leaders whose contributions positively impact communities throughout Southeast Texas.",
      },
    ],
  },
];

export function getMagazineArticle(slug: string): MagazineArticle | undefined {
  return magazineArticles.find((article) => article.slug === slug);
}
