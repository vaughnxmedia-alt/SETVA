import type { Metadata } from "next";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the SETVA team.",
};

type Props = {
  searchParams: Promise<{ subject?: string }>;
};

const subjectLabels: Record<string, string> = {
  vendor: "Vendor Application",
  sponsorship: "Sponsorship Inquiry",
  "ticket-partner": "Ticket Partner Program",
};

export default async function ContactPage({ searchParams }: Props) {
  const { subject } = await searchParams;
  const subjectLine = subject ? subjectLabels[subject] ?? subject : "";

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="Reach out"
          title="Contact us"
          subtitle="Questions about the festival, entertainment requests, partnerships, or tickets — let's make magic happen."
        />

        <div className="card-glow mt-12 rounded-2xl bg-ink-deep/60 p-8">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gold/80">
                Email
              </p>
              <a
                href={`mailto:${site.contact.email}${subjectLine ? `?subject=${encodeURIComponent(subjectLine)}` : ""}`}
                className="mt-1 block text-lg text-cream hover:text-gold"
              >
                {site.contact.email}
              </a>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gold/80">
                Phone
              </p>
              <a
                href={site.contact.phoneHref}
                className="mt-1 block text-lg text-cream hover:text-gold"
              >
                {site.contact.phone}
              </a>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gold/80">
                Location
              </p>
              <p className="mt-1 text-cream/80">
                {site.event.title}
                <br />
                {site.event.location}
              </p>
            </div>
            <a
              href={site.contact.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-full bg-ruby px-8 py-4 font-semibold text-cream shadow-lg transition hover:bg-ruby-light sm:w-auto"
            >
              Message on WhatsApp
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-cream/50">
          Follow updates on{" "}
          <a
            href={site.social.linktree}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            Linktree
          </a>
        </p>
      </div>
    </div>
  );
}
