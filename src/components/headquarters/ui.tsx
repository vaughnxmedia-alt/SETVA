import type { ReactNode } from "react";

export const hqInputClass =
  "rounded-lg border border-gold/20 bg-black/40 px-3 py-2 text-sm text-cream outline-none focus:border-gold/50";

export const hqPanelClass =
  "card-glow rounded-xl border border-gold/20 bg-ink-deep/70";

export const hqListItemClass =
  "card-glow rounded-xl border border-gold/20 bg-ink-deep/60 p-4 transition hover:border-gold/35";

export const hqTableWrapClass =
  "card-glow overflow-x-auto rounded-xl border border-gold/20";

export function HQCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`card-glow rounded-xl border border-gold/20 bg-ink-deep/70 transition hover:border-gold/35 ${className}`}
    >
      {children}
    </div>
  );
}

export function HQCardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gold/10 px-5 py-4">
      <div>
        <h2 className="font-display text-base text-cream">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-cream/45">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function HQBadge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "gold" | "green" | "amber" | "red";
}) {
  const tones = {
    default: "border-gold/15 bg-gold/5 text-cream/70",
    gold: "border-gold/30 bg-gold/10 text-gold",
    green: "border-emerald/30 bg-emerald/10 text-emerald-light",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    red: "border-red-500/30 bg-red-500/10 text-red-300",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function HQStatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <HQCard className="p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-cream/40">{label}</p>
      <p className="mt-2 font-display text-2xl text-gold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-cream/45">{hint}</p> : null}
    </HQCard>
  );
}

export function HQEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gold/20 px-6 py-16 text-center">
      <p className="font-display text-lg text-cream/70">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-cream/40">{description}</p>
    </div>
  );
}

export function HQButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
}) {
  const variants = {
    primary:
      "bg-gold/20 border-gold/40 text-gold hover:bg-gold/30",
    ghost: "border-transparent text-cream/70 hover:bg-gold/5 hover:text-cream",
    outline: "border-gold/20 text-cream/80 hover:border-gold/40 hover:text-gold",
  };
  return (
    <button
      type="button"
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function HQSearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gold/20 bg-black/40 px-3 py-2 text-sm text-cream outline-none transition placeholder:text-cream/30 focus:border-gold/50"
    />
  );
}

export function formatHQDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
