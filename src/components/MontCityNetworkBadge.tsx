import Image from "next/image";
import { montCityNetwork } from "@/lib/site";

type MontCityNetworkBadgeProps = {
  className?: string;
  compact?: boolean;
};

export function MontCityNetworkBadge({
  className = "",
  compact = false,
}: MontCityNetworkBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 ${className}`}
    >
      <Image
        src={montCityNetwork.logos.light}
        alt={montCityNetwork.name}
        width={compact ? 72 : 88}
        height={compact ? 18 : 22}
        className="h-auto w-auto max-h-5 object-contain"
      />
      {!compact && (
        <span className="hidden text-[10px] uppercase tracking-wider text-cream/50 sm:inline">
          Media partner
        </span>
      )}
    </div>
  );
}
