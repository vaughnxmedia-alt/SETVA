import type { Metadata } from "next";
import { SponsorshipDeckPresenter } from "@/components/sponsorship-deck/SponsorshipDeckPresenter";
import { createPageMetadata } from "@/lib/metadata";
import { buildSponsorshipDeckSlides } from "@/lib/sponsorship-deck";
import { site } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Sponsorship Deck",
  description: `${site.fullName} — interactive Torch of Excellence sponsorship presentation.`,
  path: "/sponsorshipdeck",
});

export default function SponsorshipDeckPage() {
  const slides = buildSponsorshipDeckSlides();

  return <SponsorshipDeckPresenter slides={slides} />;
}
