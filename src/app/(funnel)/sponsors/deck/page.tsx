import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { verifyDeckAccessToken } from "@/lib/deck-access";
import {
  sponsorDeck,
  sponsorDeckDocumentUrl,
  siteUrl,
} from "@/lib/sponsor-deck";
import { site, brandLogos } from "@/lib/site";

export const metadata: Metadata = {
  title: sponsorDeck.title,
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ access?: string }>;
};

export default async function SponsorDeckViewerPage({ searchParams }: PageProps) {
  const { access } = await searchParams;
  const token = access?.trim() ?? "";
  const payload = verifyDeckAccessToken(token);
  const base = siteUrl();

  if (!payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-center">
        <Image
          src={brandLogos.onDark}
          alt={site.fullName}
          width={220}
          height={124}
          className="h-auto w-44"
        />
        <h1 className="mt-8 font-display text-3xl text-cream">Link unavailable</h1>
        <p className="mt-4 max-w-md text-sm text-cream/70">
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

  const documentUrl = sponsorDeckDocumentUrl(base, token);

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="border-b border-gold/20 bg-gradient-to-r from-ink-deep via-black to-ruby/30 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src={brandLogos.onDark}
              alt={site.fullName}
              width={180}
              height={101}
              className="h-auto w-36 sm:w-44"
              priority
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                Private presentation
              </p>
              <h1 className="font-display text-xl text-cream sm:text-2xl">
                {sponsorDeck.title}
              </h1>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-cream/80">Prepared for {payload.name}</p>
            <p className="text-xs text-cream/50">{payload.email}</p>
          </div>
        </div>
      </header>

      <div className="border-b border-gold/10 bg-black/60 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-cream/70">
            {site.event.title} · {site.event.dateLabel}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-gold/40 px-5 py-2 text-sm font-semibold text-gold transition hover:bg-gold/10"
            >
              Open full screen
            </a>
            <a
              href={documentUrl}
              download={sponsorDeck.fileName}
              className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink transition hover:bg-gold-light"
            >
              Download PDF
            </a>
            <Link
              href={`mailto:${site.contact.email}?subject=${encodeURIComponent("SETVA 2026 Sponsorship")}`}
              className="rounded-full bg-ruby px-5 py-2 text-sm font-semibold text-white transition hover:bg-ruby-light"
            >
              Email to sponsor
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#1a1a1a] p-3 sm:p-6">
        <div className="mx-auto h-[calc(100vh-220px)] min-h-[480px] max-w-6xl overflow-hidden rounded-2xl border border-gold/20 bg-black shadow-2xl">
          <iframe
            src={documentUrl}
            title={sponsorDeck.title}
            className="h-full w-full"
          />
        </div>
      </div>

      <footer className="border-t border-gold/10 px-4 py-4 text-center text-xs text-cream/40">
        {site.motto} · This page is not listed on the public site.
      </footer>
    </div>
  );
}
