import {
  sponsorPackages,
  ticketTiers,
  vendorPackages,
} from "@/lib/site";
import { assertPackageAvailable } from "@/lib/sponsor-inventory";

export type CheckoutType = "ticket" | "donation" | "sponsor" | "vendor";

export type ResolvedCheckout = {
  name: string;
  description?: string;
  amountCents: number;
  quantity: number;
  paymentNote: string;
  cancelPath: string;
};

export function resolveCheckoutItem(
  type: CheckoutType,
  itemId: string,
  quantity = 1,
  amount?: number,
): ResolvedCheckout | { error: string; status: number } {
  if (type === "ticket") {
    const tier = ticketTiers.find((t) => t.id === itemId);
    if (!tier) {
      return { error: "Invalid ticket tier", status: 400 };
    }
    if (tier.boxOfficeOnly) {
      return {
        error:
          "Day-of tickets are sold at the Jefferson Theater Box Office from 12:00 PM to 3:00 PM on show day.",
        status: 400,
      };
    }
    const qty = Math.max(1, Math.min(quantity, 20));
    return {
      name: `SETVA 2026 — ${tier.name}`,
      description: tier.description,
      amountCents: tier.price * 100,
      quantity: qty,
      paymentNote: `SETVA ticket: ${tier.id}`,
      cancelPath: "/tickets",
    };
  }

  if (type === "donation") {
    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars < 1) {
      return { error: "Donation must be at least $1", status: 400 };
    }
    return {
      name: "SETVA Donation",
      description:
        "Support the Southeast Texas Visionary Awards and community impact.",
      amountCents: Math.round(dollars * 100),
      quantity: 1,
      paymentNote: `SETVA donation: $${dollars}`,
      cancelPath: "/donate",
    };
  }

  if (type === "sponsor") {
    const pkg = sponsorPackages.find((p) => p.id === itemId);
    if (!pkg) {
      return { error: "Invalid sponsor package", status: 400 };
    }
    if (pkg.contactOnly || pkg.price <= 0) {
      return {
        error:
          "This package is arranged directly. Please contact us to pay by check, money order, or Square.",
        status: 400,
      };
    }
    const availabilityError = assertPackageAvailable(pkg);
    if (availabilityError) {
      return { error: availabilityError, status: 400 };
    }
    return {
      name: `SETVA Sponsor — ${pkg.name}`,
      description: pkg.description,
      amountCents: pkg.price * 100,
      quantity: 1,
      paymentNote: `SETVA sponsor: ${pkg.id}`,
      cancelPath: "/sponsors",
    };
  }

  if (type === "vendor") {
    const booth = vendorPackages.find((v) => v.id === itemId);
    if (!booth) {
      return { error: "Invalid vendor package", status: 400 };
    }
    return {
      name: `SETVA Vendor — ${booth.name}`,
      description: `${booth.size} — booth package`,
      amountCents: booth.price * 100,
      quantity: 1,
      paymentNote: `SETVA vendor: ${booth.id}`,
      cancelPath: "/vendors",
    };
  }

  return { error: "Invalid checkout type", status: 400 };
}
