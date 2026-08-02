import Link from "next/link";
import { TicketmasterAnchor } from "@/components/tickets/TicketmasterAnchor";
import {
  isExternalTicketPurchase,
  ticketOpensLabel,
  ticketPurchaseHref,
} from "@/lib/ticket-sales";

type TicketPurchaseLinkProps = {
  label?: string;
  className?: string;
  externalClassName?: string;
  /** When sales are not open yet, show a disabled-style label instead of linking out. */
  gated?: boolean;
  /** Nav CTAs always link to tickets or Ticketmaster (never show "Opens" only). */
  mode?: "purchase" | "nav";
  onClick?: () => void;
};

const defaultClassName =
  "inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold-light";

export function TicketPurchaseLink({
  label = "Get Tickets",
  className = defaultClassName,
  externalClassName = className,
  gated = true,
  mode = "purchase",
  onClick,
}: TicketPurchaseLinkProps) {
  const external = isExternalTicketPurchase();
  const href = ticketPurchaseHref();

  if (mode === "purchase" && gated && !external) {
    return (
      <span className="rounded-full border border-gold/40 bg-gold/10 px-4 py-3 text-center text-sm font-semibold text-gold">
        Opens {ticketOpensLabel()}
      </span>
    );
  }

  if (external) {
    return (
      <TicketmasterAnchor href={href} className={externalClassName} onClick={onClick}>
        {label}
      </TicketmasterAnchor>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {label}
    </Link>
  );
}

export function ticketPurchaseFootnote(): string {
  if (isExternalTicketPurchase()) {
    return "Secure online checkout.";
  }
  return "Ticket information and pricing on the tickets page.";
}
