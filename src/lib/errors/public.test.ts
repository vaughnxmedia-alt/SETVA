import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PUBLIC_ERROR_MESSAGE,
  buildInternalErrorEmailHtml,
  getErrorContext,
  handleApiFailure,
  logInternalError,
  publicErrorResponse,
} from "@/lib/errors/public";

describe("public error handling", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "test" };
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns only the public-safe message from publicErrorResponse", async () => {
    const response = publicErrorResponse(500);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      success: false,
      message: PUBLIC_ERROR_MESSAGE,
    });
    expect(JSON.stringify(body).toLowerCase()).not.toMatch(
      /square|resend|supabase|aws|vercel|boxcast|token|api key|database/,
    );
  });

  it("hides Square failures behind the public message", async () => {
    const response = await handleApiFailure(
      new Error("Payment token missing from Square checkout"),
      {
        workflow: "Sponsor Checkout",
        route: "/api/sponsor-checkout",
        provider: "Square",
      },
    );
    const body = await response.json();

    expect(body.message).toBe(PUBLIC_ERROR_MESSAGE);
    expect(JSON.stringify(body)).not.toContain("Square");
    expect(JSON.stringify(body)).not.toContain("Payment token missing");
  });

  it("hides Resend failures behind the public message", async () => {
    const response = await handleApiFailure(
      new Error("Resend API rejected the request"),
      {
        workflow: "Sponsor Deck Request",
        route: "/api/sponsor-deck",
        provider: "Resend",
      },
    );
    const body = await response.json();

    expect(body.message).toBe(PUBLIC_ERROR_MESSAGE);
    expect(JSON.stringify(body)).not.toContain("Resend");
  });

  it("hides missing environment variable failures behind the public message", async () => {
    const response = await handleApiFailure(
      new Error("SPONSOR_DECK_ACCESS_SECRET is not configured"),
      {
        workflow: "Sponsor Checkout",
        route: "/api/sponsor-checkout",
        provider: "Environment",
      },
    );
    const body = await response.json();

    expect(body.message).toBe(PUBLIC_ERROR_MESSAGE);
    expect(JSON.stringify(body)).not.toContain("SPONSOR_DECK_ACCESS_SECRET");
  });

  it("hides database failures behind the public message", async () => {
    const response = await handleApiFailure(
      new Error("database connection refused"),
      {
        workflow: "Volunteer Form",
        route: "/api/volunteer",
        provider: "Database",
      },
      { status: 500 },
    );
    const body = await response.json();

    expect(body.message).toBe(PUBLIC_ERROR_MESSAGE);
    expect(JSON.stringify(body)).not.toContain("database");
  });

  it("logs internal technical context", () => {
    logInternalError(new Error("Payment token missing"), {
      workflow: "Sponsor Checkout",
      route: "/api/sponsor-checkout",
      provider: "Square",
      contactEmail: "sponsor@example.com",
      metadata: { packageId: "title-sponsor", apiKey: "secret-key" },
    });

    expect(console.error).toHaveBeenCalled();
    const logged = String((console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(logged).toContain("Payment token missing");
    expect(logged).toContain("Square");
    expect(logged).toContain("title-sponsor");
    expect(logged).not.toContain("secret-key");
  });

  it("builds internal error context with timestamp and environment", () => {
    process.env.VERCEL_ENV = "production";
    const context = getErrorContext({
      workflow: "Sponsor Checkout",
      route: "/api/sponsor-checkout",
      provider: "Square",
    });

    expect(context.workflow).toBe("Sponsor Checkout");
    expect(context.route).toBe("/api/sponsor-checkout");
    expect(context.provider).toBe("Square");
    expect(context.environment).toBe("production");
    expect(context.timestamp).toBeTruthy();
  });

  it("builds internal team notification content with technical details", () => {
    const context = {
      workflow: "Checkout",
      route: "/api/checkout",
      provider: "Square",
      contactEmail: "buyer@example.com",
    };
    const record = {
      ...getErrorContext(context),
      error: "Square payment link creation failed",
      stack: "Error: Square payment link creation failed\n    at createLink",
    };

    const html = buildInternalErrorEmailHtml(record, context);

    expect(html).toContain("Square payment link creation failed");
    expect(html).toContain("buyer@example.com");
    expect(html).toContain("/api/checkout");
    expect(html).toContain("createLink");
  });
});
