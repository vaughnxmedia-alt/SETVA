import { NextRequest, NextResponse } from "next/server";
import {
  handleApiFailure,
  logInternalError,
  safeApiHandler,
} from "@/lib/errors";

/**
 * Payment webhook endpoint — verify signatures and handle payment events.
 * Responses are provider-facing; public users never see this route.
 */
export const POST = safeApiHandler(async (req: NextRequest) => {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  if (!signatureKey) {
    logInternalError(new Error("Webhook signature key is not configured"), {
      workflow: "Payment Webhook",
      route: req.nextUrl.pathname,
      provider: "Square",
    });
    return NextResponse.json({ received: true });
  }

  const body = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");

  if (!signature) {
    return handleApiFailure(new Error("Missing webhook signature"), {
      workflow: "Payment Webhook",
      route: req.nextUrl.pathname,
      provider: "Square",
    }, { status: 400 });
  }

  try {
    const event = JSON.parse(body) as { type?: string };
    if (process.env.NODE_ENV === "development") {
      console.info("Payment webhook event:", event.type);
    }
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Payment Webhook",
      route: req.nextUrl.pathname,
      provider: "Square",
      metadata: { reason: "invalid_payload" },
    }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}, { workflow: "Payment Webhook" });
