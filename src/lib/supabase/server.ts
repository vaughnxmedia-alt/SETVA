import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

function ensureServerWebSocket(): void {
  if (typeof globalThis.WebSocket !== "undefined") return;

  try {
    // Lazy require keeps the ws package out of edge/client bundles.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebSocket = require("ws") as typeof globalThis.WebSocket;
    globalThis.WebSocket = WebSocket;
  } catch {
    // PostgREST queries still work when realtime transport is unavailable.
  }
}

export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  ensureServerWebSocket();

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
