"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { hqQuickActions, hqNav } from "@/lib/headquarters/nav";
import { daysUntilEvent } from "@/lib/headquarters/site-meta";
import type { HQNotification } from "@/lib/headquarters/types";
import { HQCommandPalette } from "@/components/headquarters/HQActivity";

import type { HQUser } from "@/lib/headquarters/auth";
import { hqUserInitials } from "@/lib/headquarters/auth";

type HQHeaderProps = {
  onMenuOpen: () => void;
  title?: string;
  user?: HQUser | null;
};

export function HQHeader({ onMenuOpen, title = "Headquarters", user: userProp }: HQHeaderProps) {
  const [user, setUser] = useState<HQUser | null>(userProp ?? null);
  const [notifications, setNotifications] = useState<HQNotification[]>([]);
  const [search, setSearch] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const days = daysUntilEvent();

  useEffect(() => {
    if (userProp) {
      setUser(userProp);
      return;
    }
    void fetch("/api/headquarters/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: HQUser } | null) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {
        /* ignore */
      });
  }, [userProp]);

  useEffect(() => {
    void fetch("/api/headquarters/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { notifications?: HQNotification[] } | null) => {
        if (data?.notifications) setNotifications(data.notifications);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) setQuickOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const searchResults =
    search.trim().length > 1
      ? hqNav.filter((n) => n.label.toLowerCase().includes(search.toLowerCase()))
      : [];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gold/20 bg-ink-deep/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={onMenuOpen}
            className="rounded-lg border border-gold/20 p-2 text-cream/70 hover:border-gold/40 lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg text-cream">{title}</h1>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-gold/20 bg-gold/5 px-3 py-1.5 sm:flex">
            <span className="text-[10px] uppercase tracking-wider text-cream/40">Event in</span>
            <span className="font-display text-sm text-gold">{days} days</span>
          </div>

          <div className="relative hidden max-w-xs flex-1 md:block">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setPaletteOpen(false)}
              placeholder="Search Headquarters…"
              className="w-full rounded-lg border border-gold/20 bg-black/40 py-2 pl-3 pr-16 text-sm text-cream outline-none focus:border-gold/50"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-gold/15 px-1.5 text-[10px] text-cream/30">
              ⌘K
            </kbd>
            {searchResults.length > 0 ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-gold/20 bg-ink-deep py-1 shadow-xl">
                {searchResults.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    onClick={() => setSearch("")}
                    className="block px-3 py-2 text-sm text-cream/80 hover:bg-gold/5 hover:text-gold"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative" ref={quickRef}>
            <button
              type="button"
              onClick={() => setQuickOpen((v) => !v)}
              className="rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-medium text-gold hover:bg-gold/20"
            >
              Quick actions
            </button>
            {quickOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-gold/20 bg-ink-deep py-1 shadow-xl">
                {hqQuickActions.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    onClick={() => setQuickOpen(false)}
                    className="block px-3 py-2 text-sm text-cream/75 hover:bg-gold/5 hover:text-gold"
                  >
                    {a.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-lg border border-gold/20 p-2 text-cream/70 hover:border-gold/40"
              aria-label="Notifications"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notifications.length > 0 ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-gold" />
              ) : null}
            </button>
            {notifOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border border-gold/20 bg-ink-deep shadow-xl">
                <div className="border-b border-gold/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cream/50">
                    System Notifications
                  </p>
                </div>
                <ul className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="px-4 py-6 text-center text-sm text-cream/40">No notifications.</li>
                  ) : (
                    notifications.map((n) => (
                      <li key={n.id}>
                        <Link
                          href={n.href}
                          onClick={() => setNotifOpen(false)}
                          className="block border-b border-gold/10 px-4 py-3 text-sm hover:bg-gold/5"
                        >
                          <p className="text-cream/80">{n.text}</p>
                          <p className="mt-0.5 text-[10px] text-cream/35">{n.time}</p>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </div>

          <Link
            href="/headquarters/settings"
            className="flex items-center gap-2 rounded-lg border border-gold/20 px-2 py-1.5 transition hover:border-gold/35"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold">
              {user ? hqUserInitials(user.name) : "—"}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-medium text-cream/80">{user?.name ?? "Team member"}</p>
              <p className="text-[10px] text-cream/35">Account</p>
            </div>
          </Link>
        </div>
      </header>
      <HQCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
