import { FORM_TYPES, listFormSubmissions, type FormSubmissionRecord } from "@/lib/form-submissions";
import { isMockFormSubmission } from "@/lib/mock-data";
import type { SponsorIntakeData } from "@/lib/sponsor-intake";
import { listMediaCredentialApplications } from "@/lib/media-credentials-store";
import { listVolunteerRegistrations } from "@/lib/volunteers-store";
import { listAmbassadorRegistrations } from "@/lib/ambassadors-store";
import { categoryTitleById, listNomineeCategories } from "@/lib/nominee-categories-store";
import { listNomineesWithTicketPartnerSlugs } from "@/lib/nominees-store";
import { sponsorPackages } from "@/lib/site";
import {
  ambassadorTicketPartnerLink,
  buildTicketPartnerAnalytics,
  listTicketLinkEvents,
  nomineeTicketPartnerLink,
} from "@/lib/ticket-link-events-store";
import { listTicketPartnerLeads } from "@/lib/ticket-partner/leads-store";
import { listTicketPurchases } from "@/lib/ticket-partner/purchases-store";
import { reconcilePurchases } from "@/lib/ticket-partner/reconcile";
import type { TicketPartnerLead } from "@/lib/ticket-partner/types";
import type {
  ActivityCategory,
  ActivityItem,
  HQAnalytics,
  HQNotification,
  HQPaymentsSummary,
  MediaApplication,
  NomineeRecord,
  SponsorLead,
  VolunteerRecord,
  AmbassadorRecord,
  NomineeTicketPartnerRecord,
  TicketFormLead,
  TicketSalesReconciliation,
  TicketSalesSourceRow,
} from "@/lib/headquarters/types";

const EMPTY_ANALYTICS: HQAnalytics = {
  website: {
    visitors: 0,
    topPages: [],
    sources: [],
    devices: [],
    locations: [],
  },
  communications: {
    sent: 0,
    delivered: 0,
    opened: 0,
    failed: 0,
  },
  applications: {
    sponsorInquiries: 0,
    mediaApplications: 0,
    volunteerRegistrations: 0,
    ambassadorRegistrations: 0,
    contactMessages: 0,
  },
  ticketPartners: {
    totalClicks: 0,
    totalPurchases: 0,
    nomineeLinks: 0,
    ambassadorLinks: 0,
    topLinks: [],
  },
};

const EMPTY_PAYMENTS: HQPaymentsSummary = {
  totalRevenue: 0,
  paidSponsors: 0,
  outstandingBalances: 0,
  deposits: 0,
  recentPayments: [],
};

function packageLabel(packageId: string): string {
  return sponsorPackages.find((pkg) => pkg.id === packageId)?.name ?? packageId;
}

function packageAmount(packageId: string): number {
  return sponsorPackages.find((pkg) => pkg.id === packageId)?.price ?? 0;
}

function intakeFromRecord(record: FormSubmissionRecord): SponsorIntakeData | null {
  const payload = record.payload as Partial<SponsorIntakeData>;
  if (!payload.companyName || !payload.contactName) return null;
  return payload as SponsorIntakeData;
}

type SponsorDeckPayload = {
  name?: string;
  email?: string;
  company?: string;
  packageId?: string;
  dealOwner?: string;
  sentBy?: string;
};

function dealOwnerLabel(payload: SponsorDeckPayload): string {
  return payload.dealOwner?.trim() || payload.sentBy?.trim() || "—";
}

function deckLeadFromRecord(record: FormSubmissionRecord): {
  name: string;
  email: string;
  company: string;
  packageId?: string;
} | null {
  const payload = record.payload as SponsorDeckPayload;
  const name = payload.name?.trim() || record.contact_name?.trim() || "";
  const email = payload.email?.trim() || record.contact_email?.trim() || "";
  const company = payload.company?.trim() || "—";
  if (!name || !email) return null;
  return {
    name,
    email,
    company,
    packageId: payload.packageId?.trim() || undefined,
  };
}

function sponsorStatus(record: FormSubmissionRecord): string {
  if (record.form_type === FORM_TYPES.sponsorCheckoutConfirmed) return "Paid";
  if (record.form_type === FORM_TYPES.sponsorDeck) return "Proposal Sent";
  if (record.form_type === FORM_TYPES.sponsorIntake) return "New Lead";
  return "New Lead";
}

function sponsorPaymentStatus(intake: SponsorIntakeData, record: FormSubmissionRecord): string {
  if (record.form_type === FORM_TYPES.sponsorCheckoutConfirmed) return "Paid in full";
  if (intake.preferredPayment?.includes("check")) return "Check pending";
  if (intake.preferredPayment?.includes("electronically")) return "Outstanding";
  return "—";
}

function realSubmissions(records: FormSubmissionRecord[]): FormSubmissionRecord[] {
  return records.filter((record) => !isMockFormSubmission(record));
}

export async function getHQSponsorPipeline(): Promise<SponsorLead[]> {
  const [intakes, confirmed, decks] = await Promise.all([
    listFormSubmissions(FORM_TYPES.sponsorIntake),
    listFormSubmissions(FORM_TYPES.sponsorCheckoutConfirmed),
    listFormSubmissions(FORM_TYPES.sponsorDeck),
  ]);

  const seen = new Set<string>();
  const leads: SponsorLead[] = [];

  for (const record of realSubmissions([...confirmed, ...decks, ...intakes])) {
    const intake = intakeFromRecord(record);
    if (intake) {
      const key = `${intake.email}:${intake.companyName}`;
      if (seen.has(key)) continue;
      seen.add(key);

      leads.push({
        id: record.external_id ?? record.id,
        company: intake.companyName,
        contact: intake.contactName,
        email: intake.email,
        packageId: intake.packageId,
        packageName: packageLabel(intake.packageId),
        dealOwner: "—",
        status: sponsorStatus(record),
        paymentStatus: sponsorPaymentStatus(intake, record),
        notes: intake.meetingNotes || intake.companyDescription || "—",
        nextAction:
          record.form_type === FORM_TYPES.sponsorCheckoutConfirmed
            ? "Activate recognition"
            : "Follow up",
      });
      continue;
    }

    const deckLead = deckLeadFromRecord(record);
    if (!deckLead) continue;
    const key = `${deckLead.email}:${deckLead.company}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const payload = record.payload as SponsorDeckPayload;

    leads.push({
      id: record.external_id ?? record.id,
      company: deckLead.company,
      contact: deckLead.name,
      email: deckLead.email,
      packageId: deckLead.packageId,
      packageName: deckLead.packageId ? packageLabel(deckLead.packageId) : "—",
      dealOwner: dealOwnerLabel(payload),
      status: sponsorStatus(record),
      paymentStatus: "—",
      notes: record.status === "hq_sent" ? "Packages link sent from HQ" : "Packages link requested",
      nextAction: "Follow up",
    });
  }

  return leads;
}

export async function getHQMediaApplications(): Promise<MediaApplication[]> {
  const applications = await listMediaCredentialApplications();
  return applications.map((app) => ({
    id: app.id,
    outlet: app.mediaOutlet || "—",
    contact: app.fullName,
    audience: app.totalFollowers || app.averageReach || "—",
    coverage: app.coverageTypes?.join(", ") || "—",
    credentialType: app.credentialType,
    teamSize: app.teamMembers || app.approvedCrewSize || "—",
    status: app.status,
  }));
}

export async function getHQVolunteers(): Promise<VolunteerRecord[]> {
  const registrations = await listVolunteerRegistrations();
  return registrations.map((reg) => ({
    id: reg.id,
    name: reg.fullName,
    category:
      reg.assignedCategory ||
      reg.volunteerCategories[0]?.replace(" Volunteer", "") ||
      "—",
    role:
      reg.assignedRole ||
      reg.eventDayInterests[0] ||
      reg.preEventInterests[0] ||
      reg.postEventInterests[0] ||
      "—",
    status: reg.status,
  }));
}

export async function getTicketPartnerAnalyticsData() {
  const [nominees, ambassadors, categories, events] = await Promise.all([
    listNomineesWithTicketPartnerSlugs(),
    listAmbassadorRegistrations(),
    listNomineeCategories(),
    listTicketLinkEvents(),
  ]);

  const nomineeLinks = nominees.map((nominee) =>
    nomineeTicketPartnerLink({
      id: nominee.id,
      name: nominee.name,
      category: categoryTitleById(categories, nominee.categoryId),
      email: nominee.contactEmail,
      slug: nominee.ticketPartnerSlug,
    }),
  );

  const ambassadorLinks = ambassadors
    .filter((reg) => reg.ticketPartnerSlug.trim())
    .map((reg) =>
      ambassadorTicketPartnerLink({
        id: reg.id,
        name: reg.fullName,
        email: reg.email,
        slug: reg.ticketPartnerSlug,
      }),
    );

  return buildTicketPartnerAnalytics([...nomineeLinks, ...ambassadorLinks], events);
}

const LEAD_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A ticket form only counts once name, a valid email, and phone are all present. */
function isCompleteLead(lead: TicketPartnerLead): boolean {
  return (
    Boolean(lead.buyerName.trim()) &&
    Boolean(lead.buyerPhone.trim()) &&
    LEAD_EMAIL_PATTERN.test(lead.buyerEmail.trim())
  );
}

function toTicketFormLead(lead: TicketPartnerLead): TicketFormLead {
  return {
    id: lead.id,
    buyerName: lead.buyerName,
    buyerEmail: lead.buyerEmail,
    buyerPhone: lead.buyerPhone,
    submittedAt: lead.submittedAt,
  };
}

/**
 * Groups captured ticket-form leads by their source (nominee/ambassador) id,
 * keeping only completed forms (name, valid email, and phone all present).
 */
function groupLeadsBySource(leads: TicketPartnerLead[]): Map<string, TicketFormLead[]> {
  const bySource = new Map<string, TicketFormLead[]>();
  for (const lead of leads) {
    if (!isCompleteLead(lead)) continue;
    const list = bySource.get(lead.sourceId) ?? [];
    list.push(toTicketFormLead(lead));
    bySource.set(lead.sourceId, list);
  }
  for (const list of bySource.values()) {
    list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }
  return bySource;
}

function mapStatsToNomineeRecord(
  stats: Awaited<ReturnType<typeof getTicketPartnerAnalyticsData>>["links"][number],
  leads: TicketFormLead[],
): NomineeTicketPartnerRecord {
  return {
    id: stats.sourceId,
    name: stats.name,
    category: stats.category,
    email: stats.email,
    ticketPartnerSlug: stats.slug,
    trackingUrl: stats.trackingUrl,
    clickCount: stats.clickCount,
    purchaseCount: stats.purchaseCount,
    lastClickAt: stats.lastClickAt,
    lastPurchaseAt: stats.lastPurchaseAt,
    leads,
  };
}

function mapStatsToAmbassadorRecord(
  reg: Awaited<ReturnType<typeof listAmbassadorRegistrations>>[number],
  stats: Awaited<ReturnType<typeof getTicketPartnerAnalyticsData>>["links"][number] | undefined,
  leads: TicketFormLead[],
): AmbassadorRecord {
  return {
    id: reg.id,
    name: reg.fullName,
    email: reg.email,
    city: reg.city,
    organization: reg.organization || "—",
    channels: reg.promotionChannels.join(", ") || "—",
    ambassadorLink: reg.ambassadorLink,
    ticketPartnerSlug: reg.ticketPartnerSlug,
    status: reg.status,
    reviewedByName: reg.reviewedByName,
    reviewedByEmail: reg.reviewedByEmail,
    reviewedAt: reg.reviewedAt,
    clickCount: stats?.clickCount ?? 0,
    purchaseCount: stats?.purchaseCount ?? 0,
    lastClickAt: stats?.lastClickAt ?? null,
    lastPurchaseAt: stats?.lastPurchaseAt ?? null,
    leads,
  };
}

export async function getHQNomineeTicketPartners(): Promise<NomineeTicketPartnerRecord[]> {
  const [analytics, leads] = await Promise.all([
    getTicketPartnerAnalyticsData(),
    listTicketPartnerLeads(),
  ]);
  const leadsBySource = groupLeadsBySource(leads);
  return analytics.links
    .filter((link) => link.sourceType === "nominee")
    .map((link) => mapStatsToNomineeRecord(link, leadsBySource.get(link.sourceId) ?? []));
}

export async function getHQAmbassadors(): Promise<AmbassadorRecord[]> {
  const [registrations, analytics, leads] = await Promise.all([
    listAmbassadorRegistrations(),
    getTicketPartnerAnalyticsData(),
    listTicketPartnerLeads(),
  ]);
  const statsById = new Map(
    analytics.links
      .filter((link) => link.sourceType === "ambassador")
      .map((link) => [link.sourceId, link]),
  );
  const leadsBySource = groupLeadsBySource(leads);

  return registrations.map((reg) =>
    mapStatsToAmbassadorRecord(reg, statsById.get(reg.id), leadsBySource.get(reg.id) ?? []),
  );
}

/**
 * Reconciles imported Ticketmaster buyers against captured ticket-form leads,
 * attributing sales (and commission basis) to each nominee/ambassador.
 */
export async function getTicketSalesReconciliation(): Promise<TicketSalesReconciliation> {
  const [analytics, allLeads, purchases] = await Promise.all([
    getTicketPartnerAnalyticsData(),
    listTicketPartnerLeads(),
    listTicketPurchases(),
  ]);

  // Only reconcile against completed forms (name + valid email + phone).
  const leads = allLeads.filter(isCompleteLead);
  const leadsBySource = groupLeadsBySource(leads);
  const reconciliation = reconcilePurchases(leads, purchases);

  const rows: TicketSalesSourceRow[] = analytics.links
    .map((link) => {
      const sourceLeads = leadsBySource.get(link.sourceId) ?? [];
      const match = reconciliation.bySourceId.get(link.sourceId);
      const matchedBuyers = match?.matchedBuyers ?? [];
      // Only surface partners that have activity worth reconciling.
      if (sourceLeads.length === 0 && matchedBuyers.length === 0) return null;
      return {
        sourceId: link.sourceId,
        sourceType: link.sourceType,
        name: link.name,
        category: link.category,
        email: link.email,
        trackingUrl: link.trackingUrl,
        clickCount: link.clickCount,
        leads: sourceLeads,
        matchedBuyers,
        ticketsSold: match?.ticketsSold ?? 0,
        salesAmount: match?.salesAmount ?? 0,
      } satisfies TicketSalesSourceRow;
    })
    .filter((row): row is TicketSalesSourceRow => row !== null)
    .sort(
      (a, b) =>
        b.ticketsSold - a.ticketsSold ||
        b.leads.length - a.leads.length ||
        a.name.localeCompare(b.name),
    );

  return {
    rows,
    unmatchedBuyers: reconciliation.unmatchedBuyers,
    totals: {
      totalLeads: leads.length,
      importedBuyers: reconciliation.totals.importedBuyers,
      matchedBuyers: reconciliation.totals.matchedBuyers,
      ticketsSold: reconciliation.totals.ticketsSold,
      salesAmount: reconciliation.totals.salesAmount,
    },
  };
}

export async function getHQNominees(): Promise<NomineeRecord[]> {
  const [nominees, categories] = await Promise.all([
    listNomineesWithTicketPartnerSlugs(),
    listNomineeCategories(),
  ]);
  return nominees.map((nominee) => ({
    id: nominee.id,
    name: nominee.name,
    category: categoryTitleById(categories, nominee.categoryId),
    contactStatus: nominee.contactEmail ? "Contact Added" : "Missing",
    confirmationStatus: nominee.confirmationStatus,
    winner: false,
    notes: nominee.internalNotes,
  }));
}

export async function getHQPaymentsSummary(): Promise<HQPaymentsSummary> {
  const confirmed = realSubmissions(
    await listFormSubmissions(FORM_TYPES.sponsorCheckoutConfirmed),
  );
  const intakes = realSubmissions(await listFormSubmissions(FORM_TYPES.sponsorIntake));

  const recentPayments = confirmed
    .map((record) => {
      const intake = intakeFromRecord(record);
      if (!intake) return null;
      return {
        id: record.external_id ?? record.id,
        org: intake.companyName,
        amount: packageAmount(intake.packageId),
        status: "Completed",
        date: record.submitted_at.slice(0, 10),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const totalRevenue = recentPayments.reduce((sum, pay) => sum + pay.amount, 0);
  const outstanding = intakes
    .map((record) => intakeFromRecord(record))
    .filter((intake): intake is SponsorIntakeData => intake !== null)
    .reduce((sum, intake) => sum + packageAmount(intake.packageId), 0);

  if (recentPayments.length === 0 && intakes.length === 0) {
    return EMPTY_PAYMENTS;
  }

  return {
    totalRevenue,
    paidSponsors: recentPayments.length,
    outstandingBalances: Math.max(0, outstanding - totalRevenue),
    deposits: 0,
    recentPayments,
  };
}

function activityCategoryForFormType(formType: string): ActivityCategory {
  switch (formType) {
    case FORM_TYPES.mediaCredentials:
      return "Media";
    case FORM_TYPES.volunteers:
      return "Volunteers";
    case FORM_TYPES.ambassadors:
      return "Ambassadors";
    case FORM_TYPES.nominees:
      return "Nominees";
    case FORM_TYPES.sponsorIntake:
    case FORM_TYPES.sponsorDeck:
    case FORM_TYPES.sponsorCheckoutConfirmed:
      return "Sponsors";
    case FORM_TYPES.hqTeamMembers:
      return "Headquarters";
    case FORM_TYPES.checkout:
      return "Payments";
    case FORM_TYPES.ticketLinkEvents:
      return "Ambassadors";
    default:
      return "General";
  }
}

function activityFromSubmission(record: FormSubmissionRecord): ActivityItem {
  const category = activityCategoryForFormType(record.form_type);
  const personOrOrg =
    record.contact_name ||
    (typeof record.payload.companyName === "string" ? record.payload.companyName : null) ||
    (typeof record.payload.mediaOutlet === "string" ? record.payload.mediaOutlet : null) ||
    record.contact_email ||
    "Submission";

  return {
    id: record.id,
    timestamp: record.submitted_at,
    category,
    type: "Submission received",
    personOrOrg,
    summary: `${record.form_type.replaceAll("_", " ")} — ${record.status.replaceAll("_", " ")}`,
  };
}

export async function getHQActivityFeed(): Promise<ActivityItem[]> {
  const [media, volunteers, ambassadors, sponsors, confirmed, decks, hqTeam] = await Promise.all([
    listFormSubmissions(FORM_TYPES.mediaCredentials),
    listFormSubmissions(FORM_TYPES.volunteers),
    listFormSubmissions(FORM_TYPES.ambassadors),
    listFormSubmissions(FORM_TYPES.sponsorIntake),
    listFormSubmissions(FORM_TYPES.sponsorCheckoutConfirmed),
    listFormSubmissions(FORM_TYPES.sponsorDeck),
    listFormSubmissions(FORM_TYPES.hqTeamMembers),
  ]);

  return [...media, ...volunteers, ...ambassadors, ...sponsors, ...confirmed, ...decks, ...hqTeam]
    .filter((record) => !isMockFormSubmission(record))
    .map(activityFromSubmission)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getHQAnalytics(): Promise<HQAnalytics> {
  const [sponsors, media, volunteers, ambassadors, ticketPartners] = await Promise.all([
    listFormSubmissions(FORM_TYPES.sponsorIntake),
    listFormSubmissions(FORM_TYPES.mediaCredentials),
    listFormSubmissions(FORM_TYPES.volunteers),
    listFormSubmissions(FORM_TYPES.ambassadors),
    getTicketPartnerAnalyticsData(),
  ]);

  const realSponsors = realSubmissions(sponsors);
  const realMedia = realSubmissions(media);
  const realVolunteers = realSubmissions(volunteers);
  const realAmbassadors = realSubmissions(ambassadors);

  return {
    ...EMPTY_ANALYTICS,
    applications: {
      sponsorInquiries: realSponsors.length,
      mediaApplications: realMedia.length,
      volunteerRegistrations: realVolunteers.length,
      ambassadorRegistrations: realAmbassadors.length,
      contactMessages: 0,
    },
    ticketPartners: {
      totalClicks: ticketPartners.totalClicks,
      totalPurchases: ticketPartners.totalPurchases,
      nomineeLinks: ticketPartners.links.filter((link) => link.sourceType === "nominee").length,
      ambassadorLinks: ticketPartners.links.filter((link) => link.sourceType === "ambassador").length,
      topLinks: ticketPartners.links.slice(0, 8).map((link) => ({
        name: link.name,
        sourceType: link.sourceType,
        clicks: link.clickCount,
        purchases: link.purchaseCount,
      })),
    },
  };
}

export async function getHQNotifications(): Promise<HQNotification[]> {
  const [media, volunteers, ambassadors, sponsors] = await Promise.all([
    getHQMediaApplications(),
    getHQVolunteers(),
    getHQAmbassadors(),
    getHQSponsorPipeline(),
  ]);

  const notifications: HQNotification[] = [];

  const pendingMedia = media.filter((item) => item.status === "Pending Review").length;
  if (pendingMedia > 0) {
    notifications.push({
      id: "media-pending",
      text: `${pendingMedia} media application${pendingMedia === 1 ? "" : "s"} awaiting review`,
      time: "Now",
      href: "/headquarters/media",
    });
  }

  const pendingVolunteers = volunteers.filter((item) => item.status === "Pending Review").length;
  if (pendingVolunteers > 0) {
    notifications.push({
      id: "volunteers-pending",
      text: `${pendingVolunteers} volunteer registration${pendingVolunteers === 1 ? "" : "s"} pending`,
      time: "Now",
      href: "/headquarters/volunteers",
    });
  }

  const pendingAmbassadors = ambassadors.filter((item) => item.status === "Pending Review").length;
  if (pendingAmbassadors > 0) {
    notifications.push({
      id: "ambassadors-pending",
      text: `${pendingAmbassadors} ambassador registration${pendingAmbassadors === 1 ? "" : "s"} pending`,
      time: "Now",
      href: "/headquarters/ambassadors",
    });
  }

  const newSponsors = sponsors.filter((item) => item.status === "New Lead").length;
  if (newSponsors > 0) {
    notifications.push({
      id: "sponsors-new",
      text: `${newSponsors} new sponsor inquir${newSponsors === 1 ? "y" : "ies"}`,
      time: "Now",
      href: "/headquarters/sponsors",
    });
  }

  return notifications;
}
