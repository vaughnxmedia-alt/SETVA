"use client";

import { useState, type ReactNode } from "react";
import {
  externalBrowserUrl,
  inAppBrowserName,
  openInBrowserHint,
} from "@/lib/in-app-browser";
import { useUserAgent } from "@/lib/use-user-agent";

type TicketmasterAnchorProps = {
  href: string;
  children: ReactNode;
  className: string;
  onClick?: () => void;
};

/**
 * Links out to Ticketmaster, but inside an embedded social browser it offers a
 * way into a real browser first — Ticketmaster answers those webviews with a
 * bot check that the host app renders as "page not found".
 */
export function TicketmasterAnchor({
  href,
  children,
  className,
  onClick,
}: TicketmasterAnchorProps) {
  const [showEscape, setShowEscape] = useState(false);
  const [copied, setCopied] = useState(false);

  const userAgent = useUserAgent();
  const embeddedApp = inAppBrowserName(userAgent);
  const escapeUrl = embeddedApp ? externalBrowserUrl(href, userAgent) : null;
  const hint = embeddedApp ? openInBrowserHint(userAgent, embeddedApp) : "";

  async function copyLink() {
    try {
      await window.navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={(event) => {
          onClick?.();
          if (!embeddedApp) return;
          event.preventDefault();
          setShowEscape(true);
        }}
      >
        {children}
      </a>

      {showEscape ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowEscape(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-gold/25 bg-ink-deep p-6 text-left"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-display text-lg text-cream">Open Ticketmaster in your browser</h2>
            <p className="mt-2 text-sm text-cream/70">{hint}</p>

            {escapeUrl ? (
              <a
                href={escapeUrl}
                className="mt-5 block w-full rounded-full bg-ruby px-6 py-3 text-center text-sm font-semibold text-white"
              >
                Open in browser
              </a>
            ) : null}

            <button
              type="button"
              onClick={() => void copyLink()}
              className="mt-3 w-full rounded-full border border-gold/30 px-6 py-3 text-sm font-semibold text-gold"
            >
              {copied ? "Link copied" : "Copy ticket link"}
            </button>

            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center text-xs text-cream/45 underline"
            >
              Continue here anyway
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
