import type { Metadata } from "next";
import { site } from "@/lib/site";

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://setvawards.com";
  return url.replace(/\/$/, "");
}

export const shareImage = {
  path: "/og-share.jpg",
  width: 1200,
  height: 630,
  alt: `${site.fullName} — August 8, 2026 · Beaumont, Texas`,
} as const;

type PageMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
};

export function createPageMetadata({
  title,
  description,
  path = "",
}: PageMetadataOptions = {}): Metadata {
  const pageTitle = title ?? `${site.fullName} | ${site.name} 2026`;
  const pageDescription = description ?? site.tagline;
  const canonicalPath = path || "/";
  const pageUrl = `${getSiteUrl()}${canonicalPath}`;

  return {
    title: title,
    description: pageDescription,
    metadataBase: new URL(getSiteUrl()),
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: pageUrl,
      siteName: site.name,
      locale: "en_US",
      type: "website",
      images: [
        {
          url: shareImage.path,
          width: shareImage.width,
          height: shareImage.height,
          alt: shareImage.alt,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [shareImage.path],
    },
  };
}
