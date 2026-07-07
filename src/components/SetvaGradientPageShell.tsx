import type { ReactNode } from "react";

export function SetvaGradientPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="setva-gradient-page relative min-h-full overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#000000_0%,#000000_24%,#050000_34%,#7f1d0a_42%,#ea580c_50%,#fbbf24_56%,#f97316_62%,#c2410c_76%,#1a0000_90%,#000000_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_58%,rgba(251,191,36,0.24),transparent_68%)]"
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

      <div className="relative z-10 min-w-0 overflow-x-hidden">{children}</div>
    </div>
  );
}
