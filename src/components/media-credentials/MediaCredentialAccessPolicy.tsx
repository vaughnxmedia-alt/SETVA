import { mediaCredentialAccessZones } from "@/lib/media-credentials";

export function MediaCredentialAccessPolicy() {
  return (
    <section className="card-glow rounded-2xl border border-gold/20 bg-ink-deep/70 p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        Access zones
      </p>
      <p className="mt-3 text-sm text-cream/70">
        Please review where media are permitted at SETVA before you apply.
      </p>
      <div className="mt-6 space-y-4">
        {mediaCredentialAccessZones.map((zone) => (
          <div
            key={zone.title}
            className="rounded-xl border border-white/10 bg-black/25 px-4 py-4"
          >
            <p className="font-semibold text-cream">{zone.title}</p>
            <p className="mt-2 text-sm text-cream/75">{zone.policy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
