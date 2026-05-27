import { NextRequest, NextResponse } from "next/server";
import { resolveCheckoutItem } from "@/lib/checkout-items";
import { createSquarePaymentLink, isSquareConfigured } from "@/lib/square";

type CheckoutBody = {
  type: "ticket" | "donation" | "sponsor" | "vendor";
  itemId: string;
  quantity?: number;
  amount?: number;
};

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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
      url: `${base}/thank-you?${params.toString()}`,
      demo: true,
    });
  }

  const resolved = resolveCheckoutItem(type, itemId, quantity, amount);
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
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

    return NextResponse.json({ url });
  } catch (e) {
    console.error("Square checkout error:", e);
    return NextResponse.json(
      { error: "Could not create Square checkout link" },
      { status: 500 },
    );
  }
}
