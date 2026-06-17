import type { Metadata } from "next";
import { SocialHub } from "@/components/SocialHub";
import { createPageMetadata } from "@/lib/metadata";
import { site, socialHub } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: `Connect with ${site.name}`,
  description: `${socialHub.bio} ${socialHub.tagline}`,
  path: "/links",
});

export default function LinksPage() {
  return <SocialHub />;
}
