import { HQShell } from "@/components/headquarters/HQShell";
import { HQActivitySection } from "@/components/headquarters/HQActivitySection";
import { HQCard, HQEmptyState, HQStatCard } from "@/components/headquarters/ui";
import { getHQActivityFeed, getHQAnalytics } from "@/lib/headquarters/data";

export default async function AnalyticsPage() {
  const [analytics, activity] = await Promise.all([getHQAnalytics(), getHQActivityFeed()]);
  const { website, communications, applications } = analytics;

  return (
    <HQShell title="Analytics" showActivityRail={false}>
      <p className="mb-6 text-sm text-cream/50">
        Performance across website, communications, applications, and team activity.
      </p>

      <h2 className="mb-3 font-display text-base text-gold">Website Performance</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <HQStatCard label="Visitors" value={website.visitors.toLocaleString()} hint="Last 30 days" />
        <HQCard className="p-4 sm:col-span-2">
          <p className="text-[11px] uppercase tracking-wider text-cream/40">Top pages</p>
          {website.topPages.length === 0 ? (
            <p className="mt-3 text-sm text-cream/40">No website data connected yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {website.topPages.map((pg) => (
                <li key={pg.page} className="flex justify-between text-sm">
                  <span className="text-cream/70">{pg.page}</span>
                  <span className="text-gold">{pg.views.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </HQCard>
      </div>

      <h2 className="mb-3 font-display text-base text-gold">Communication Performance</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        <HQStatCard label="Emails sent" value={communications.sent} />
        <HQStatCard label="Delivered" value={communications.delivered} />
        <HQStatCard label="Opened" value={communications.opened} />
        <HQStatCard label="Failed" value={communications.failed} />
      </div>

      <h2 className="mb-3 font-display text-base text-gold">Application Metrics</h2>
      <div className="mb-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <HQStatCard label="Sponsor inquiries" value={applications.sponsorInquiries} />
        <HQStatCard label="Media applications" value={applications.mediaApplications} />
        <HQStatCard label="Volunteer registrations" value={applications.volunteerRegistrations} />
        <HQStatCard label="Ambassador registrations" value={applications.ambassadorRegistrations} />
        <HQStatCard label="Contact messages" value={applications.contactMessages} />
      </div>

      {activity.length === 0 ? (
        <HQEmptyState
          title="No activity yet"
          description="Operational activity will appear here as submissions and updates are recorded."
        />
      ) : (
        <HQActivitySection items={activity} />
      )}
    </HQShell>
  );
}
