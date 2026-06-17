import { HQShell } from "@/components/headquarters/HQShell";
import { HQBadge, HQEmptyState, hqTableWrapClass } from "@/components/headquarters/ui";
import { getHQNominees } from "@/lib/headquarters/data";

export default async function NomineesPage() {
  const nominees = await getHQNominees();

  return (
    <HQShell title="Nominees">
      <p className="mb-6 text-sm text-cream/50">
        Nominee categories, confirmations, and winner tracking.
      </p>
      {nominees.length === 0 ? (
        <HQEmptyState
          title="No nominees yet"
          description="Nominee records will appear here when connected."
        />
      ) : (
        <div className={hqTableWrapClass}>
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-gold/15 bg-gold/5 text-[11px] uppercase tracking-wider text-cream/40">
              <tr>
                <th className="px-4 py-3">Nominee</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Confirmation</th>
                <th className="px-4 py-3">Winner</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {nominees.map((n) => (
                <tr key={n.id} className="hover:bg-gold/[0.03]">
                  <td className="px-4 py-3 font-medium text-cream">{n.name}</td>
                  <td className="px-4 py-3 text-cream/70">{n.category}</td>
                  <td className="px-4 py-3">
                    <HQBadge>{n.contactStatus}</HQBadge>
                  </td>
                  <td className="px-4 py-3">
                    <HQBadge tone={n.confirmationStatus === "Attending" ? "green" : "amber"}>
                      {n.confirmationStatus}
                    </HQBadge>
                  </td>
                  <td className="px-4 py-3">
                    {n.winner ? <HQBadge tone="gold">Winner</HQBadge> : <span className="text-cream/30">—</span>}
                  </td>
                  <td className="px-4 py-3 text-cream/50">{n.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </HQShell>
  );
}
