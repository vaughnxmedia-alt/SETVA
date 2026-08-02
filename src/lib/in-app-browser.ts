/**
 * Ticketmaster answers embedded social webviews with an Akamai identity check
 * instead of the event page, so those users see the host app's generic
 * "page not found" screen. Detect the webview and hand the buyer a way out
 * into a real browser instead of navigating into the block.
 */

const IN_APP_SIGNATURES: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /FBAN|FBAV|FB_IAB|FBIOS|FBDV/i, name: "Facebook" },
  { pattern: /Messenger|MessengerLite/i, name: "Messenger" },
  { pattern: /Instagram/i, name: "Instagram" },
  { pattern: /Threads/i, name: "Threads" },
  { pattern: /TikTok|BytedanceWebview|musical_ly|Bytedance/i, name: "TikTok" },
  { pattern: /Twitter|TwitterAndroid/i, name: "X" },
  { pattern: /LinkedInApp/i, name: "LinkedIn" },
  { pattern: /Snapchat/i, name: "Snapchat" },
  { pattern: /Pinterest/i, name: "Pinterest" },
  { pattern: /MicroMessenger/i, name: "WeChat" },
  { pattern: /\bLine\//i, name: "LINE" },
  { pattern: /GSA\//i, name: "Google app" },
];

export function inAppBrowserName(userAgent: string): string | null {
  if (!userAgent) return null;
  for (const { pattern, name } of IN_APP_SIGNATURES) {
    if (pattern.test(userAgent)) return name;
  }
  return null;
}

export function isInAppBrowser(userAgent: string): boolean {
  return inAppBrowserName(userAgent) !== null;
}

export function isIOSDevice(userAgent: string): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent);
}

export function isAndroidDevice(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

/**
 * Best-effort link that breaks out of an embedded webview. Android accepts an
 * intent URL with a fallback; iOS has no supported API, so `x-safari-https`
 * is attempted and the UI still shows manual instructions.
 */
export function externalBrowserUrl(url: string, userAgent: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (isAndroidDevice(userAgent)) {
    const withoutScheme = trimmed.replace(/^https?:\/\//i, "");
    const fallback = encodeURIComponent(trimmed);
    return `intent://${withoutScheme}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
  }

  if (isIOSDevice(userAgent)) {
    return trimmed.replace(/^https:\/\//i, "x-safari-https://");
  }

  return null;
}

/** Manual escape wording, since iOS webviews cannot be redirected out. */
export function openInBrowserHint(userAgent: string, appName: string | null): string {
  const app = appName ?? "this app";
  if (isIOSDevice(userAgent)) {
    return `Tap the ••• menu in the top corner, then choose "Open in Safari" — ${app}'s built-in browser is blocked by Ticketmaster.`;
  }
  if (isAndroidDevice(userAgent)) {
    return `Tap the ⋮ menu in the top corner, then choose "Open in Chrome" — ${app}'s built-in browser is blocked by Ticketmaster.`;
  }
  return `Open this page in Safari or Chrome — ${app}'s built-in browser is blocked by Ticketmaster.`;
}
