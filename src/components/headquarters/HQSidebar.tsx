"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hqNav } from "@/lib/headquarters/nav";
import { hqBranding } from "@/lib/headquarters/site-meta";
import { site } from "@/lib/site";

type HQSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function HQSidebar({ open, onClose }: HQSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gold/20 bg-ink-deep transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-gold/15 px-4 py-4">
          <Link href="/headquarters" onClick={onClose} className="group block">
            <Image
              src="/setva-logo-header-transparent.png"
              alt={site.fullName}
              width={1024}
              height={576}
              className="hq-logo-gold h-auto w-[130px] object-contain transition group-hover:scale-[1.02]"
              sizes="130px"
            />
          </Link>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">
            Headquarters
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {hqNav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-gold/15 text-gold"
                        : "text-cream/65 hover:bg-gold/5 hover:text-cream"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="space-y-3 border-t border-gold/15 px-4 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-cream/35">Event</p>
            <p className="mt-1 text-xs font-medium text-cream/70">{hqBranding.event}</p>
            <p className="text-xs text-gold/80">{hqBranding.eventDate}</p>
          </div>
          <Link
            href="/"
            className="block text-xs text-cream/40 transition hover:text-gold"
          >
            ← Back to {site.name}
          </Link>
        </div>
      </aside>
    </>
  );
}
