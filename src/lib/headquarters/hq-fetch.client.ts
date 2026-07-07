"use client";

import { HQ_SESSION_EXPIRED_MESSAGE } from "@/lib/headquarters/api-auth.constants";

const LOGIN_PATH = "/headquarters/login";

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `${LOGIN_PATH}?expired=1&next=${next}`;
}

/** Authenticated fetch for Headquarters — redirects to login on 401. */
export async function hqFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, {
    credentials: "same-origin",
    ...init,
  });

  if (res.status === 401 && typeof window !== "undefined") {
    redirectToLogin();
    throw new Error(HQ_SESSION_EXPIRED_MESSAGE);
  }

  return res;
}

/** Throws a clear message when an HQ API response is unauthorized. */
export function assertHQResponse(res: Response, fallbackMessage: string): void {
  if (res.status === 401) {
    throw new Error(HQ_SESSION_EXPIRED_MESSAGE);
  }
  if (!res.ok) {
    throw new Error(fallbackMessage);
  }
}

export { redirectToLogin as redirectHQToLogin };
