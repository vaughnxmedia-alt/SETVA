"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/headquarters/sponsors/outreach", label: "Outreach" },
  { href: "/headquarters/sponsors/packages", label: "Packages & buyers" },
] as const;

export function SponsorsSubnav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-gold/10 pb-4">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-gold/15 text-gold"
                : "text-cream/60 hover:bg-gold/5 hover:text-cream"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
