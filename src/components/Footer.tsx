import Link from "next/link";
import { footerNav, montCityNetwork, site } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gold/20 bg-ink-deep">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg text-gold">{site.name}</p>
            <p className="mt-2 text-sm text-cream/60">{site.motto}</p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gold/80">
              Support
            </p>
            <ul className="mt-3 space-y-2 text-sm text-cream/70">
              <li>
                <Link href="/tickets" className="hover:text-gold">
                  Tickets
                </Link>
              </li>
              <li>
                <Link href="/donate" className="hover:text-gold">
                  Donate
                </Link>
              </li>
              <li>
                <Link href="/sponsors" className="hover:text-gold">
                  Sponsor Packages
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="hover:text-gold">
                  Vendors
                </Link>
              </li>
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gold/80">
              Connect
            </p>
            <ul className="mt-3 space-y-2 text-sm text-cream/70">
              <li>
                <a href={`mailto:${site.contact.email}`} className="hover:text-gold">
                  {site.contact.email}
                </a>
              </li>
              <li>
                <a href={site.contact.phoneHref} className="hover:text-gold">
                  {site.contact.phone}
                </a>
              </li>
              <li>
                <Link href={site.social.hub} className="hover:text-gold">
                  All links
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gold/80">
              Event
            </p>
            <p className="mt-3 text-sm text-cream/70">
              {site.event.title}
              <br />
              {site.event.dateLabel} · {site.event.location}
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gold/10 pt-8 text-center text-xs text-cream/50 sm:flex-row sm:text-left">
          <Link
            href="/headquarters"
            className="text-cream/50 no-underline transition hover:text-cream/50"
            aria-label="Team Access"
          >
            © {year} {site.org}. All rights reserved.
          </Link>
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <p className="text-cream/40">
              Live on {montCityNetwork.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
