export type HQNavChild = {
  href: string;
  label: string;
};

export type HQNavItem = {
  href: string;
  label: string;
  children?: HQNavChild[];
};

export const hqNav: HQNavItem[] = [
  {
    href: "/headquarters/sponsors",
    label: "Sponsors",
    children: [
      { href: "/headquarters/sponsors/outreach", label: "Outreach" },
      { href: "/headquarters/sponsors/packages", label: "Packages & buyers" },
    ],
  },
  { href: "/headquarters/media", label: "Media" },
  { href: "/headquarters/volunteers", label: "Volunteers" },
  { href: "/headquarters/ambassadors", label: "Ambassadors" },
  { href: "/headquarters/ticket-sales", label: "Ticket Sales" },
  { href: "/headquarters/analytics", label: "Analytics" },
  { href: "/headquarters/categories", label: "Categories" },
  { href: "/headquarters/nominees", label: "Nominees" },
  { href: "/headquarters/voting", label: "Voting" },
  { href: "/headquarters/magazine", label: "Visionary Magazine" },
  { href: "/headquarters/honorees", label: "Honorees" },
  { href: "/headquarters/users", label: "Users" },
  { href: "/headquarters/payments", label: "Payments" },
  { href: "/headquarters/settings", label: "Settings" },
];

export const hqQuickActions = [
  { label: "Sponsor outreach", href: "/headquarters/sponsors/outreach" },
  { label: "Sponsor packages", href: "/headquarters/sponsors/packages" },
  { label: "Media credentials", href: "/headquarters/media" },
  { label: "Volunteer roster", href: "/headquarters/volunteers" },
  { label: "Ambassador roster", href: "/headquarters/ambassadors" },
  { label: "Analytics & activity", href: "/headquarters/analytics" },
] as const;
