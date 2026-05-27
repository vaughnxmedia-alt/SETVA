"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { mainNav, site } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group flex flex-col">
          <span className="font-display text-xl tracking-wide text-gold transition group-hover:text-gold-light sm:text-2xl">
            {site.name}
          </span>
          <span className="hidden text-xs text-cream/60 sm:block">
            {site.fullName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {mainNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm transition ${
                  active
                    ? "bg-gold/15 text-gold"
                    : "text-cream/80 hover:bg-white/5 hover:text-cream"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/tickets"
            className="ml-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-light"
          >
            Get Tickets
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-cream md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-gold/10 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-cream/90 hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/tickets"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-gold px-4 py-3 text-center font-semibold text-ink"
            >
              Get Tickets
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
