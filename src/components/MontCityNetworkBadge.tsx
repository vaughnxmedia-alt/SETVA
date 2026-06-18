import Image from "next/image";
import { montCityNetwork } from "@/lib/site";

const transparentLogo = "/partners/mont-city-network-logo-white-transparent.png";

type MontCityNetworkBadgeProps = {
  className?: string;
  compact?: boolean;
  /** Logo only — no pill border or background */
  bare?: boolean;
};

export function MontCityNetworkBadge({
  className = "",
  compact = false,
  bare = false,
}: MontCityNetworkBadgeProps) {
  if (bare || compact) {
    return (
      <Image
        src={transparentLogo}
        alt={montCityNetwork.name}
        width={273}
        height={120}
        className={`h-auto w-auto object-contain ${compact ? "max-h-5" : "max-h-8 w-28"} ${className}`}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 ${className}`}
    >
      <Image
        src={transparentLogo}
        alt={montCityNetwork.name}
        width={88}
        height={22}
        className="h-auto w-auto max-h-5 object-contain"
      />
      <span className="hidden text-[10px] uppercase tracking-wider text-cream/50 sm:inline">
        Media partner
      </span>
    </div>
  );
}
