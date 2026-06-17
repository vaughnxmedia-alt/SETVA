import type { Metadata } from "next";
import { Suspense } from "react";
import { SponsorCheckoutFlow } from "@/components/sponsor-checkout/SponsorCheckoutFlow";

export const metadata: Metadata = {
  title: "Sponsorship Checkout",
  robots: { index: false, follow: false },
};

export default function SponsorCheckoutPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl text-center text-cream/70">
            Loading sponsorship checkout…
          </div>
        }
      >
        <SponsorCheckoutFlow />
      </Suspense>
    </div>
  );
}
