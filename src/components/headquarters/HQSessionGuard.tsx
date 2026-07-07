"use client";

import { useEffect } from "react";
import { redirectHQToLogin } from "@/lib/headquarters/hq-fetch.client";

const SESSION_CHECK_MS = 3 * 60 * 1000;

/**
 * Keeps HQ sessions honest in the browser. Server-rendered pages can still load
 * briefly after a sessionVersion bump; API saves then fail until re-login.
 */
export function HQSessionGuard() {
  useEffect(() => {
    let checking = false;

    async function verifySession() {
      if (checking) return;
      checking = true;
      try {
        const res = await fetch("/api/headquarters/session", { credentials: "same-origin" });
        if (!res.ok) redirectHQToLogin();
      } catch {
        /* network blip — don't force logout */
      } finally {
        checking = false;
      }
    }

    void verifySession();

    const interval = window.setInterval(() => void verifySession(), SESSION_CHECK_MS);
    const onFocus = () => void verifySession();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}
