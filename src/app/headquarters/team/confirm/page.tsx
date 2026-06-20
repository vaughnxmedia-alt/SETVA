import Image from "next/image";
import Link from "next/link";
import { brandLogos, site } from "@/lib/site";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    name?: string;
    message?: string;
  }>;
};

export default async function TeamConfirmPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status ?? "";
  const name = params.name ? decodeURIComponent(params.name) : "";
  const message = params.message ? decodeURIComponent(params.message) : "";

  let title = "Team confirmation";
  let body = "This confirmation link is no longer valid.";

  if (status === "approved") {
    title = "Team member confirmed";
    body = name
      ? `${name} was approved. Their SETVA ID was emailed and they can create their account.`
      : "The team member was approved and notified by email.";
  } else if (status === "error") {
    title = "Confirmation failed";
    body = message || "Unable to confirm this team member.";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-12">
      <div className="card-glow w-full max-w-md rounded-2xl border border-gold/20 bg-ink-deep/80 p-8 sm:p-10">
        <Link href="/" className="group mb-8 flex justify-center">
          <Image
            src={brandLogos.onDark}
            alt={site.fullName}
            width={1024}
            height={576}
            className="h-auto w-[160px] object-contain transition group-hover:scale-[1.02]"
            sizes="160px"
            priority
          />
        </Link>
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/70">
          Headquarters
        </p>
        <h1 className="mt-3 text-center font-display text-2xl text-cream">{title}</h1>
        <p className="mt-4 text-center text-sm leading-relaxed text-cream/60">{body}</p>
        <p className="mt-8 text-center">
          <Link href="/headquarters/login" className="text-sm text-gold hover:text-gold/80">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
