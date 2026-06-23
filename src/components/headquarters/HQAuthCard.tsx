"use client";

import Image from "next/image";
import Link from "next/link";
import { brandLogos, site } from "@/lib/site";

export function HQAuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-12">
      <div className="card-glow w-full max-w-md overflow-hidden rounded-2xl border border-gold/20 bg-ink-deep/80">
        <div className="border-b border-gold/15 bg-gradient-to-br from-black via-ink-deep to-ruby/20 px-8 pb-8 pt-10 text-center">
          <Link href="/" className="group mb-6 inline-flex justify-center">
            <Image
              src={brandLogos.onDark}
              alt={site.fullName}
              width={1024}
              height={576}
              className="h-auto w-[140px] object-contain transition group-hover:scale-[1.02]"
              sizes="140px"
              priority
            />
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/70">
            Headquarters
          </p>
          <h1 className="mt-3 font-display text-2xl text-cream">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-cream/55">{subtitle}</p>
        </div>
        <div className="p-8 sm:p-10">{children}</div>
        {footer ? (
          <div className="border-t border-gold/10 px-8 py-4 text-center text-xs text-cream/45">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const hqAuthInputClass =
  "w-full rounded-xl border border-gold/20 bg-black/50 px-4 py-3 text-cream outline-none transition placeholder:text-cream/30 focus:border-gold/50 focus:ring-1 focus:ring-gold/20";

export const hqAuthLabelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/45";

export const hqAuthButtonClass =
  "w-full rounded-full border border-gold/40 bg-gradient-to-r from-gold/20 to-gold/10 py-3.5 text-sm font-semibold text-gold transition hover:from-gold/30 hover:to-gold/20 disabled:opacity-60";
