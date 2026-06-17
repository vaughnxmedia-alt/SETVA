import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SponsorshipDeckPresenter } from "@/components/sponsorship-deck/SponsorshipDeckPresenter";
import { verifyDeckAccessToken } from "@/lib/deck-access";
import { sponsorDeck } from "@/lib/sponsor-deck";
import { buildSponsorshipDeckSlides } from "@/lib/sponsorship-deck";
import { site, brandLogos } from "@/lib/site";

export const sponsorshipDeckAccessMetadata: Metadata = {
  title: sponsorDeck.title,
  robots: { index: false, follow: false },
};

export function SponsorshipDeckAccessView({ access }: { access: string }) {
  const token = access.trim();
  const payload = verifyDeckAccessToken(token);
  const slides = buildSponsorshipDeckSlides();

  if (!payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
        <Image
          src={brandLogos.onLight}
          alt={site.fullName}
          width={220}
          height={124}
          className="h-auto w-44"
        />
        <h1 className="mt-8 font-display text-3xl text-ink">Link unavailable</h1>
        <p className="mt-4 max-w-md text-sm text-ink/70">
          This sponsorship deck link is invalid or has expired. Request a fresh copy
          from the sponsor packages page.
        </p>
        <Link
          href="/sponsors#get-deck"
          className="mt-8 rounded-full bg-ruby px-8 py-3 text-sm font-semibold text-white transition hover:bg-ruby-light"
        >
          Get the sponsor deck
        </Link>
      </div>
    );
  }

  return (
    <SponsorshipDeckPresenter
      slides={slides}
      preparedFor={{ name: payload.name, email: payload.email }}
    />
  );
}
