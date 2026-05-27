import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PlaceholderNote } from "@/components/PlaceholderNote";
import { SectionHeading } from "@/components/SectionHeading";
import { site, vendorPackages } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vendors",
  description: "Apply to vend at SETVA 2026 — sample booth packages.",
};

export default function VendorsPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Now seeking vendors"
          title="Vendor opportunities"
          subtitle="Showcase your business at SETVA 2026 and connect with thousands celebrating Southeast Texas visionaries."
        />
        <PlaceholderNote className="mx-auto mt-8 max-w-xl" />

        <div className="card-glow mx-auto mt-10 max-w-3xl space-y-4 rounded-2xl bg-ink-deep/60 p-8 text-cream/80">
          <p>
            We&apos;re building an unforgettable vendor village for{" "}
            {site.event.title}. Spaces include food, retail, arts, wellness, and
            community organizations.
          </p>
          <p className="text-sm text-cream/50">
            Venue: {site.event.venue}
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {vendorPackages.map((booth) => (
            <article
              key={booth.id}
              className="card-glow flex flex-col rounded-2xl bg-ink-deep/60 p-8"
            >
              <h3 className="font-display text-xl text-cream">{booth.name}</h3>
              <p className="mt-1 text-sm text-gold">{booth.size}</p>
              <p className="mt-4 text-3xl font-semibold text-gold">
                ${booth.price}
                <span className="text-base font-normal text-cream/50">
                  {" "}
                  sample
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-cream/80">
                {booth.includes.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-gold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 space-y-3">
                <CheckoutButton
                  type="vendor"
                  itemId={booth.id}
                  label={`Preview — Reserve`}
                  className="w-full"
                  variant="outline"
                />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/contact?subject=vendor"
            className="rounded-full bg-gold px-8 py-4 font-semibold text-ink hover:bg-gold-light"
          >
            Questions? Contact us
          </Link>
          <a
            href={site.contact.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-gold/50 px-8 py-4 font-semibold text-gold hover:bg-gold/10"
          >
            Message on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
