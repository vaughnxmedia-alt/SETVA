import { NextRequest, NextResponse } from "next/server";
import { resolveCheckoutItem } from "@/lib/checkout-items";
import {
  handleApiFailure,
  safeApiHandler,
} from "@/lib/errors";
import { createSquarePaymentLink, isSquareConfigured } from "@/lib/square";
import { getPublicSiteUrl } from "@/lib/site-url";

type CheckoutBody = {
  type: "ticket" | "donation" | "sponsor" | "vendor";
  itemId: string;
  quantity?: number;
  amount?: number;
};

function siteUrl(): string {
  return getPublicSiteUrl();
}

export const POST = safeApiHandler(async (req: NextRequest) => {
  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Checkout",
      route: req.nextUrl.pathname,
      provider: "Checkout API",
      metadata: { reason: "invalid_json" },
    }, { status: 400, notifyTeam: false });
  }

  const { type, itemId, quantity = 1, amount } = body;
  const base = siteUrl();

  if (!isSquareConfigured()) {
    const params = new URLSearchParams({
      demo: "1",
      type,
      itemId,
      quantity: String(quantity),
    });
    if (amount != null) params.set("amount", String(amount));
    return NextResponse.json({
      success: true,
      url: `${base}/thank-you?${params.toString()}`,
      demo: true,
    });
  }

  const resolved = resolveCheckoutItem(type, itemId, quantity, amount);
  if ("error" in resolved) {
    return handleApiFailure(new Error(resolved.error), {
      workflow: "Checkout",
      route: req.nextUrl.pathname,
      provider: "Square",
      metadata: { type, itemId, quantity, amount },
    }, { status: resolved.status, notifyTeam: false });
  }

  try {
    const url = await createSquarePaymentLink({
      name: resolved.name,
      description: resolved.description,
      amountCents: resolved.amountCents,
      quantity: resolved.quantity,
      paymentNote: resolved.paymentNote,
      redirectUrl: `${base}/thank-you?type=${type}&item=${itemId}`,
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Checkout",
      route: req.nextUrl.pathname,
      provider: "Square",
      metadata: { type, itemId, quantity, amount },
    });
  }
}, { workflow: "Checkout" });
