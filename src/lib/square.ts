import { SquareClient, SquareEnvironment } from "square";

let client: SquareClient | null = null;

export function isSquareConfigured(): boolean {
  return Boolean(
    process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID,
  );
}

export function getSquareLocationId(): string {
  const id = process.env.SQUARE_LOCATION_ID;
  if (!id) {
    throw new Error("SQUARE_LOCATION_ID is not configured");
  }
  return id;
}

export function getSquareClient(): SquareClient {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SQUARE_ACCESS_TOKEN is not configured");
  }

  if (!client) {
    const isProduction = process.env.SQUARE_ENVIRONMENT === "production";
    client = new SquareClient({
      token,
      environment: isProduction
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
    });
  }

  return client;
}

export type SquareCheckoutItem = {
  name: string;
  description?: string;
  amountCents: number;
  quantity?: number;
  paymentNote: string;
  redirectUrl: string;
};

/** Creates a Square-hosted checkout page and returns the buyer-facing URL. */
export async function createSquarePaymentLink(
  item: SquareCheckoutItem,
): Promise<string> {
  const square = getSquareClient();
  const locationId = getSquareLocationId();
  const qty = Math.max(1, item.quantity ?? 1);
  const totalCents = item.amountCents * qty;
  const displayName =
    qty > 1 ? `${item.name} (×${qty})` : item.name;

  const response = await square.checkout.paymentLinks.create({
    idempotencyKey: crypto.randomUUID(),
    description: item.description,
    paymentNote: item.paymentNote.slice(0, 500),
    quickPay: {
      name: displayName.slice(0, 255),
      priceMoney: {
        amount: BigInt(totalCents),
        currency: "USD",
      },
      locationId,
    },
    checkoutOptions: {
      redirectUrl: item.redirectUrl,
      merchantSupportEmail: process.env.SQUARE_SUPPORT_EMAIL,
    },
  });

  const url =
    response.paymentLink?.url ?? response.paymentLink?.longUrl ?? null;

  if (!url) {
    const detail = response.errors?.[0]?.detail ?? "Unknown Square error";
    throw new Error(detail);
  }

  return url;
}
