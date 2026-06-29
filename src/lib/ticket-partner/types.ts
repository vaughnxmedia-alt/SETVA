export type TicketPartnerSource = "nominee" | "ambassador";

export type TicketLinkEventType = "click" | "purchase";

export type TicketLinkEvent = {
  id: string;
  slug: string;
  sourceType: TicketPartnerSource;
  sourceId: string;
  sourceName: string;
  eventType: TicketLinkEventType;
  occurredAt: string;
  referrer: string;
  userAgent: string;
};

export type TicketPartnerLinkStats = {
  slug: string;
  sourceType: TicketPartnerSource;
  sourceId: string;
  name: string;
  category: string;
  email: string;
  trackingUrl: string;
  clickCount: number;
  purchaseCount: number;
  lastClickAt: string | null;
  lastPurchaseAt: string | null;
};

export type TicketPartnerAnalytics = {
  totalClicks: number;
  totalPurchases: number;
  links: TicketPartnerLinkStats[];
  recentEvents: TicketLinkEvent[];
};
