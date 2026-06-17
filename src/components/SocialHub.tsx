import Image from "next/image";
import Link from "next/link";
import { brandLogos, socialHub, site } from "@/lib/site";

function HubLink({
  link,
  prominent = false,
}: {
  link: { label: string; description?: string; href: string; external?: boolean };
  prominent?: boolean;
}) {
  const className = prominent
    ? "block w-full rounded-2xl bg-ruby px-5 py-4 text-center shadow-lg shadow-ruby/20 transition hover:bg-ruby-light"
    : "block w-full rounded-2xl border border-gold/25 bg-white/5 px-5 py-4 text-left transition hover:border-gold/50 hover:bg-gold/10";

  const content = (
    <>
      <span className={`block font-semibold ${prominent ? "text-white" : "text-cream"}`}>
        {link.label}
      </span>
      {link.description && (
        <span
          className={`mt-1 block text-sm ${prominent ? "text-white/80" : "text-cream/60"}`}
        >
          {link.description}
        </span>
      )}
    </>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {content}
    </Link>
  );
}

export function SocialHub() {
  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,#1a0000_0%,#000000_45%,#0b0000_100%)]">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col px-4 py-10 sm:px-6">
        <header className="text-center">
          <Link
            href="/"
            className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-black/40 shadow-lg shadow-ruby/10 transition hover:border-gold/50"
            aria-label="Back to SETVA home"
          >
            <Image
              src={socialHub.logo}
              alt={`${site.name} logo`}
              width={96}
              height={96}
              className="h-20 w-20 object-contain"
              priority
            />
          </Link>
          <h1 className="mt-6 font-display text-3xl text-cream">{socialHub.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-cream/75">{socialHub.bio}</p>
          <p className="mt-3 text-sm font-medium text-ruby-light">{socialHub.tagline}</p>
        </header>

        <div className="mt-10">
          <HubLink link={socialHub.primaryLink} prominent />
        </div>

        <nav aria-label="SETVA links" className="mt-4 flex flex-col gap-3">
          {socialHub.links.map((link) => (
            <HubLink key={link.label} link={link} />
          ))}
        </nav>

        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cream/40">
            Social media
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {socialHub.socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-gold/30 px-5 py-2 text-sm font-semibold text-gold transition hover:bg-gold/10"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <a
            href={socialHub.recapVideo.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-2xl border border-gold/25 bg-white/5 transition hover:border-gold/50 hover:bg-gold/10"
          >
            <div className="relative aspect-video bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://img.youtube.com/vi/${socialHub.recapVideo.videoId}/hqdefault.jpg`}
                alt={socialHub.recapVideo.label}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                <span className="rounded-full bg-ruby px-5 py-2 text-sm font-semibold text-white shadow-lg">
                  ▶ Watch on YouTube
                </span>
              </div>
            </div>
            <div className="px-5 py-4 text-left">
              <span className="block font-semibold text-cream">{socialHub.recapVideo.label}</span>
              <span className="mt-1 block text-sm text-cream/60">
                {socialHub.recapVideo.description}
              </span>
            </div>
          </a>
        </div>

        <footer className="mt-auto pt-10 text-center">
          <Link href="/" className="text-sm text-cream/50 transition hover:text-gold">
            setvawards.com →
          </Link>
          <p className="mt-3 text-xs text-cream/35">{site.motto}</p>
        </footer>
      </div>
    </div>
  );
}
