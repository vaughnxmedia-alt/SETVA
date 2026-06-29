export type ActivityCategory =
  | "Sponsors"
  | "Media"
  | "Volunteers"
  | "Ambassadors"
  | "Nominees"
  | "Headquarters"
  | "Payments"
  | "Broadcast"
  | "Website"
  | "Content"
  | "General";

export type ActivityItem = {
  id: string;
  timestamp: string;
  category: ActivityCategory;
  type: string;
  personOrOrg: string;
  summary: string;
};

export type CommunicationItem = {
  id: string;
  direction: "inbound" | "outbound";
  workflow: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string;
};

export type SponsorLead = {
  id: string;
  company: string;
  contact: string;
  packageName: string;
  status: string;
  paymentStatus: string;
  notes: string;
  nextAction: string;
};

export type MediaApplication = {
  id: string;
  outlet: string;
  contact: string;
  audience: string;
  coverage: string;
  credentialType: string;
  teamSize: string;
  status: string;
};

export type VolunteerRecord = {
  id: string;
  name: string;
  category: string;
  role: string;
  status: string;
};

export type AmbassadorRecord = {
  id: string;
  name: string;
  email: string;
  city: string;
  organization: string;
  channels: string;
  ambassadorLink: string;
  ticketPartnerSlug: string;
  status: string;
  reviewedByName: string;
  reviewedByEmail: string;
  reviewedAt: string;
  clickCount: number;
  purchaseCount: number;
  lastClickAt: string | null;
  lastPurchaseAt: string | null;
};

export type NomineeTicketPartnerRecord = {
  id: string;
  name: string;
  category: string;
  email: string;
  ticketPartnerSlug: string;
  trackingUrl: string;
  clickCount: number;
  purchaseCount: number;
  lastClickAt: string | null;
  lastPurchaseAt: string | null;
};

export type NomineeRecord = {
  id: string;
  name: string;
  category: string;
  contactStatus: string;
  confirmationStatus: string;
  winner: boolean;
  notes: string;
};

export type HQNotification = {
  id: string;
  text: string;
  time: string;
  href: string;
};

export type HQPaymentsSummary = {
  totalRevenue: number;
  paidSponsors: number;
  outstandingBalances: number;
  deposits: number;
  recentPayments: {
    id: string;
    org: string;
    amount: number;
    status: string;
    date: string;
  }[];
};

export type HQAnalytics = {
  website: {
    visitors: number;
    topPages: { page: string; views: number }[];
    sources: { source: string; percent: number }[];
    devices: { device: string; percent: number }[];
    locations: string[];
  };
  communications: {
    sent: number;
    delivered: number;
    opened: number;
    failed: number;
  };
  applications: {
    sponsorInquiries: number;
    mediaApplications: number;
    volunteerRegistrations: number;
    ambassadorRegistrations: number;
    contactMessages: number;
  };
  ticketPartners: {
    totalClicks: number;
    totalPurchases: number;
    nomineeLinks: number;
    ambassadorLinks: number;
    topLinks: {
      name: string;
      sourceType: string;
      clicks: number;
      purchases: number;
    }[];
  };
};
