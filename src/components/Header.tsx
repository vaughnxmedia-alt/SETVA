"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { replayHomeHero } from "@/components/HomeHeroVideo";
import { brandLogos, mainNav, site } from "@/lib/site";
import { TicketPurchaseLink } from "@/components/TicketPurchaseLink";

function handleHomeClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  pathname: string,
  href: string,
) {
  if (href !== "/" || pathname !== "/") return;
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
  replayHomeHero();
}

function handleNominationsClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  pathname: string,
  href: string,
) {
  if (href !== "/nominations" || pathname !== "/nominations") return;
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ruby/20 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          onClick={(event) => handleHomeClick(event, pathname, "/")}
          className="group flex items-center"
        >
          <Image
            src={brandLogos.onLight}
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
                onClick={(event) => {
                  if (item.href === "/") {
                    handleHomeClick(event, pathname, item.href);
                  } else if (item.href === "/nominations") {
                    handleNominationsClick(event, pathname, item.href);
                  }
                  if (item.href !== "/") {
                    setOpen(false);
                  } else if (pathname !== "/") {
                    setOpen(false);
                  }
                }}
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
          <TicketPurchaseLink
            label="Get Tickets"
            mode="nav"
            className="ml-2 rounded-full bg-ruby px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
            externalClassName="ml-2 rounded-full bg-ruby px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
          />
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
                onClick={(event) => {
                  if (item.href === "/") {
                    handleHomeClick(event, pathname, item.href);
                  } else if (item.href === "/nominations") {
                    handleNominationsClick(event, pathname, item.href);
                  }
                  setOpen(false);
                }}
                className="rounded-lg px-3 py-2 text-black/80 hover:bg-ruby/10 hover:text-ruby"
              >
                {item.label}
              </Link>
            ))}
            <TicketPurchaseLink
              label="Get Tickets"
              mode="nav"
              onClick={() => setOpen(false)}
              className="mt-2 w-full rounded-full bg-ruby px-4 py-3 text-center font-semibold text-white"
              externalClassName="mt-2 block w-full rounded-full bg-ruby px-4 py-3 text-center font-semibold text-white"
            />
          </div>
        </nav>
      )}
    </header>
  );
}
