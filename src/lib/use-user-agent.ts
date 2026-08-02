"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => window.navigator.userAgent;
const serverSnapshot = () => "";

/**
 * Reads the browser user agent without an effect, so components can branch on
 * it during render while still matching the server's empty first paint.
 */
export function useUserAgent(): string {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
