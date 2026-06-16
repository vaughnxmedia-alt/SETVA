"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { mainNav, site } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ruby/20 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center">
          <Image
            src="/setva-logo-header-transparent.png"
            alt={site.fullName}
            width={1024}
            height={576}
            priority
            className="h-auto w-[150px] min-w-[150px] object-contain transition group-hover:scale-[1.02] sm:w-[180px] sm:min-w-[180px]"
            sizes="(max-width: 640px) 150px, 180px"
          />
          <span className="sr-only">{site.name}</span>
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
                    ? "bg-ruby text-white"
                    : "text-black/80 hover:bg-ruby/10 hover:text-ruby"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/tickets"
            className="ml-2 rounded-full bg-ruby px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
          >
            Get Tickets
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-black md:hidden"
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
        <nav className="border-t border-ruby/10 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-black/80 hover:bg-ruby/10 hover:text-ruby"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/tickets"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-ruby px-4 py-3 text-center font-semibold text-white"
            >
              Get Tickets
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
