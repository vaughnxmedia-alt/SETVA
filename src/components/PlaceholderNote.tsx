export function PlaceholderNote({ className = "" }: { className?: string }) {
  return (
    <p
      className={`rounded-lg border border-amber-500/20 bg-amber-950/40 px-4 py-3 text-center text-sm text-amber-100/90 ${className}`}
    >
      Sample pricing and details — final numbers coming soon.
    </p>
  );
}
