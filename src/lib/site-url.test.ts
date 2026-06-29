import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicSiteUrl, isVercelAppHost } from "@/lib/site-url";

describe("site url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects vercel deployment hosts", () => {
    expect(isVercelAppHost("setva.vercel.app")).toBe(true);
    expect(isVercelAppHost("setvawards.com")).toBe(false);
  });

  it("never returns vercel.app in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://setva.vercel.app");
    expect(getPublicSiteUrl()).toBe("https://www.setvawards.com");
  });

  it("uses configured custom domain when set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.setvawards.com");
    expect(getPublicSiteUrl()).toBe("https://www.setvawards.com");
  });
});
