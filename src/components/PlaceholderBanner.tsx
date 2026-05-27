import { usingPlaceholderData } from "@/lib/site";

export function PlaceholderBanner() {
  if (!usingPlaceholderData) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-950/80 px-4 py-2 text-center text-sm text-amber-100">
      <span className="font-semibold text-amber-300">Preview mode:</span>{" "}
      Prices, venue, and lineup use sample data. Payments simulate locally until
      Square is connected.
    </div>
  );
}
