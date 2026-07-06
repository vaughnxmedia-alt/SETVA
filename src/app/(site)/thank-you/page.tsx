import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thank You",
  robots: { index: false },
};

type Props = {
  searchParams: Promise<{
    demo?: string;
    type?: string;
    item?: string;
    itemId?: string;
    amount?: string;
  }>;
};

export default async function ThankYouPage({ searchParams }: Props) {
  const params = await searchParams;
  const isDemo = params.demo === "1";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16 sm:px-6">
      <div className="max-w-lg text-center">
        <p className="text-5xl">✨</p>
        <h1 className="mt-4 font-display text-3xl text-cream sm:text-4xl">
          {isDemo ? "Preview checkout complete" : "Thank you for your support!"}
        </h1>
        <p className="mt-4 text-cream/70">
          {isDemo ? (
            <>
              No payment was processed — checkout is not fully configured yet.
              Connect Square to accept live payments.
            </>
          ) : (
            <>
              Your payment was received through Square. You should get a receipt
              by email. We can&apos;t wait to celebrate with you at SETVA 2026.
            </>
          )}
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-gold px-8 py-3 font-semibold text-ink hover:bg-gold-light"
          >
            Back to home
          </Link>
          <Link
            href={params.type === "sponsor" ? "/sponsors" : "/tickets"}
            className="rounded-full border border-gold/50 px-8 py-3 font-semibold text-gold hover:bg-gold/10"
          >
            {params.type === "sponsor" ? "View sponsor packages" : "View tickets"}
          </Link>
        </div>
      </div>
    </div>
  );
}
