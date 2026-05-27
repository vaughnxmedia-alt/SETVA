import { NextRequest, NextResponse } from "next/server";

/**
 * Square webhook endpoint — verify signatures and handle payment events.
 * @see https://developer.squareup.com/docs/webhooks/overview
 *
 * In Square Developer Dashboard → Webhooks, subscribe to:
 * - payment.updated
 * - order.updated (optional)
 *
 * Set SQUARE_WEBHOOK_SIGNATURE_KEY from the dashboard.
 */
export async function POST(req: NextRequest) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  if (!signatureKey) {
    console.warn("Square webhook received but SQUARE_WEBHOOK_SIGNATURE_KEY is unset");
    return NextResponse.json({ received: true });
  }

  const body = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");
  const notificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/webhooks/square`;

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // TODO: verify with WebhooksHelper from 'square' when going live
  // WebhooksHelper.isValidWebhookEventSignature(body, signature, signatureKey, notificationUrl)

  try {
    const event = JSON.parse(body) as { type?: string };
    console.info("Square webhook:", event.type);
    // TODO: mark orders paid, send confirmation emails, etc.
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
