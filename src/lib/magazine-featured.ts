import type { MagazineArticle } from "@/lib/magazine";

/** Always-on SETVA editorial features. Supabase articles with the same slug take precedence. */
export const featuredMagazineArticles: MagazineArticle[] = [
  {
    slug: "setva-returns-august-8-2026",
    title:
      "Southeast Texas Visionary Awards Returns August 8 to Celebrate Excellence Across the Region",
    excerpt:
      "SETVA returns to the Jefferson Theatre for an evening celebrating leaders, creatives, and changemakers across Southeast Texas.",
    publishedAt: "2026-06-18T12:00:00.000Z",
    publishedLabel: "June 18, 2026",
    nomineeBioHtml: "",
    pullQuote: "",
    articleBodyHtml: [
      "<p>The Southeast Texas Visionary Awards (SETVA) will return on Saturday, August 8, 2026, bringing together community leaders, entrepreneurs, creatives, nonprofits, and changemakers for an evening dedicated to celebrating excellence throughout Southeast Texas.</p>",
      "<p>Held at the historic Jefferson Theatre in downtown Beaumont, the annual event recognizes individuals and organizations whose work continues to make a lasting impact across the region. From business and education to community service and culture, SETVA shines a spotlight on those helping shape the future of Southeast Texas.</p>",
      "<p>Created to honor visionaries and amplify stories that deserve recognition, the Southeast Texas Visionary Awards has become a celebration of leadership, innovation, and community pride.</p>",
      "<p>Additional announcements regarding award categories, nominees, sponsorship opportunities, volunteers, and special guests will be shared in the coming weeks.</p>",
      "<h2>About SETVA</h2>",
      "<p>The Southeast Texas Visionary Awards is an annual awards program dedicated to recognizing outstanding individuals, businesses, nonprofits, and leaders whose contributions positively impact communities throughout Southeast Texas.</p>",
    ].join(""),
  },
];

export function featuredMagazineArticleBySlug(slug: string): MagazineArticle | undefined {
  return featuredMagazineArticles.find((article) => article.slug === slug);
}
