import type { ReactNode } from "react";

export function NominationsPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="nominations-page relative min-h-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#000000_0%,#0d0000_12%,#7f1d0a_28%,#ea580c_42%,#fbbf24_50%,#f97316_58%,#c2410c_72%,#1a0000_88%,#000000_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_46%,rgba(251,191,36,0.28),transparent_68%)]"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 opacity-[0.22]" aria-hidden>
        <div className="grid h-full min-h-full grid-cols-3 gap-2 p-3 sm:grid-cols-6 sm:gap-3 sm:p-5">
          {Array.from({ length: 30 }).map((_, index) => (
            <div
              key={index}
              className="min-h-16 rounded-md border border-white/15 bg-white/[0.04] sm:min-h-24"
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
