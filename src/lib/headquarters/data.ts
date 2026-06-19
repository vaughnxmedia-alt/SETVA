import { FORM_TYPES, listFormSubmissions, type FormSubmissionRecord } from "@/lib/form-submissions";
import type { SponsorIntakeData } from "@/lib/sponsor-intake";
import { listMediaCredentialApplications } from "@/lib/media-credentials-store";
import { listVolunteerRegistrations } from "@/lib/volunteers-store";
import { listAmbassadorRegistrations } from "@/lib/ambassadors-store";
import { categoryTitleById, listNomineeCategories } from "@/lib/nominee-categories-store";
import { listNominees } from "@/lib/nominees-store";
import { sponsorPackages } from "@/lib/site";
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

export async function getHQSponsorPipeline(): Promise<SponsorLead[]> {
  const [intakes, confirmed, decks] = await Promise.all([
    listFormSubmissions(FORM_TYPES.sponsorIntake),
    listFormSubmissions(FORM_TYPES.sponsorCheckoutConfirmed),
    listFormSubmissions(FORM_TYPES.sponsorDeck),
  ]);

  const seen = new Set<string>();
  const leads: SponsorLead[] = [];

  for (const record of [...confirmed, ...decks, ...intakes]) {
    const intake = intakeFromRecord(record);
    if (!intake) continue;
    const key = `${intake.email}:${intake.companyName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    leads.push({
      id: record.external_id ?? record.id,
      company: intake.companyName,
      contact: intake.contactName,
      packageName: packageLabel(intake.packageId),
      status: sponsorStatus(record),
      paymentStatus: sponsorPaymentStatus(intake, record),
      notes: intake.meetingNotes || intake.companyDescription || "—",
      nextAction: record.form_type === FORM_TYPES.sponsorCheckoutConfirmed ? "Activate recognition" : "Follow up",
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

export async function getHQAmbassadors(): Promise<AmbassadorRecord[]> {
  const registrations = await listAmbassadorRegistrations();
  return registrations.map((reg) => ({
    id: reg.id,
    name: reg.fullName,
    email: reg.email,
    city: reg.city,
    organization: reg.organization || "—",
    channels: reg.promotionChannels.join(", ") || "—",
    ambassadorLink: reg.ambassadorLink,
    status: reg.status,
  }));
}

export async function getHQNominees(): Promise<NomineeRecord[]> {
  const [nominees, categories] = await Promise.all([listNominees(), listNomineeCategories()]);
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
  const confirmed = await listFormSubmissions(FORM_TYPES.sponsorCheckoutConfirmed);
  const intakes = await listFormSubmissions(FORM_TYPES.sponsorIntake);

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
    case FORM_TYPES.checkout:
      return "Payments";
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
  const [media, volunteers, ambassadors, sponsors, confirmed, decks] = await Promise.all([
    listFormSubmissions(FORM_TYPES.mediaCredentials),
    listFormSubmissions(FORM_TYPES.volunteers),
    listFormSubmissions(FORM_TYPES.ambassadors),
    listFormSubmissions(FORM_TYPES.sponsorIntake),
    listFormSubmissions(FORM_TYPES.sponsorCheckoutConfirmed),
    listFormSubmissions(FORM_TYPES.sponsorDeck),
  ]);

  return [...media, ...volunteers, ...ambassadors, ...sponsors, ...confirmed, ...decks]
    .map(activityFromSubmission)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getHQAnalytics(): Promise<HQAnalytics> {
  const [sponsors, media, volunteers, ambassadors] = await Promise.all([
    listFormSubmissions(FORM_TYPES.sponsorIntake),
    listFormSubmissions(FORM_TYPES.mediaCredentials),
    listFormSubmissions(FORM_TYPES.volunteers),
    listFormSubmissions(FORM_TYPES.ambassadors),
  ]);

  return {
    ...EMPTY_ANALYTICS,
    applications: {
      sponsorInquiries: sponsors.length,
      mediaApplications: media.length,
      volunteerRegistrations: volunteers.length,
      ambassadorRegistrations: ambassadors.length,
      contactMessages: 0,
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
