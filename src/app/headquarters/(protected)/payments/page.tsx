import { HQShell } from "@/components/headquarters/HQShell";
import { HQCard, HQCardHeader, HQBadge, HQEmptyState, HQStatCard, formatCurrency } from "@/components/headquarters/ui";
import { getHQPaymentsSummary } from "@/lib/headquarters/data";

export default async function PaymentsPage() {
  const p = await getHQPaymentsSummary();

  return (
    <HQShell title="Payments">
      <p className="mb-6 text-sm text-cream/50">Sponsorship revenue and payment status.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HQStatCard label="Total Revenue" value={formatCurrency(p.totalRevenue)} />
        <HQStatCard label="Paid Sponsors" value={p.paidSponsors} />
        <HQStatCard label="Outstanding Balances" value={formatCurrency(p.outstandingBalances)} />
        <HQStatCard label="Deposits" value={formatCurrency(p.deposits)} />
      </div>
      <HQCard className="mt-6 overflow-hidden">
        <HQCardHeader title="Recent Payments" subtitle="Latest sponsorship transactions" />
        {p.recentPayments.length === 0 ? (
          <div className="px-5 pb-6">
            <HQEmptyState
              title="No payments yet"
              description="Confirmed sponsorship payments will appear here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-gold/10">
            {p.recentPayments.map((pay) => (
              <li key={pay.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-cream">{pay.org}</p>
                  <p className="text-xs text-cream/40">{pay.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-display text-lg text-gold">{formatCurrency(pay.amount)}</p>
                  <HQBadge tone={pay.status === "Completed" ? "green" : "amber"}>{pay.status}</HQBadge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </HQCard>
    </HQShell>
  );
}
