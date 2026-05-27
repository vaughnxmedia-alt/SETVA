/** Set to false once real pricing, venue, and lineup are confirmed. */
export const usingPlaceholderData = true;

export const site = {
  name: "SETVA",
  fullName: "Southeast Texas Visionary Awards",
  tagline:
    "More than an awards show. It's how we restore the pulse of our communities.",
  motto: "Celebrate the Gift. Heal the Soul. Impact the Future.",
  event: {
    title: "Southeast Texas Visionary Awards 2026",
    dateLabel: "August 8, 2026",
    dateShort: "August 2026",
    time: "5:00 PM",
    location: "Beaumont, Texas",
    venue: "Jefferson Theater",
    boxOffice: "Jefferson Theater Box Office",
    dayOfTicketWindow: "12:00 PM – 3:00 PM (day of the Awards show)",
    address: "Beaumont, TX 77701",
    presenter: "The Healing House of Impact™",
  },
  contact: {
    email: "setvaawards@gmail.com",
    phone: "318-592-1768",
    phoneHref: "tel:+13185921768",
    whatsapp: "https://wa.me/13185921768",
  },
  social: {
    facebook: "https://www.facebook.com/557613147426788",
    linktree: "https://linktr.ee/SETVA",
    instagram: "https://linktr.ee/SETVA",
  },
  founders: "Solomon and Tierrene' Ajao",
  org: "African Vue Corporation",
} as const;

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/tickets", label: "Tickets" },
  { href: "/donate", label: "Donate" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/vendors", label: "Vendors" },
  { href: "/contact", label: "Contact" },
] as const;

export const footerNav = [
  { href: "/nominees", label: "Nominees" },
  { href: "/ticket-partners", label: "Ticket Partners" },
  { href: "/faq", label: "FAQ" },
] as const;

export type TicketTier = {
  id: string;
  name: string;
  price: number;
  description: string;
  perks: string[];
  available?: number;
  /** Shown after price, e.g. "couple" instead of "ticket". */
  unitLabel?: string;
  /** Sold in person only — no online checkout. */
  boxOfficeOnly?: boolean;
  highlighted?: boolean;
};

export const ticketTiers: TicketTier[] = [
  {
    id: "early-bird",
    name: "Early Bird",
    price: 25,
    description: "Limited pre-sale — save before prices go up.",
    perks: ["Awards show admission", "General seating"],
    highlighted: true,
  },
  {
    id: "general",
    name: "General Admission",
    price: 30,
    description: "Standard admission to the Southeast Texas Visionary Awards.",
    perks: ["Awards show admission", "General seating"],
  },
  {
    id: "couples",
    name: "Couples Discount",
    price: 50,
    unitLabel: "couple",
    description: "Two admissions at a discounted rate.",
    perks: ["2 awards show tickets", "General seating for two"],
  },
  {
    id: "day-of",
    name: "Day-of Tickets",
    price: 40,
    description:
      "Available day of the Awards show, 12:00 PM – 3:00 PM at the Jefferson Theater Box Office.",
    perks: [
      "Awards show admission",
      "Cash or card at the box office",
      "While supplies last",
    ],
    boxOfficeOnly: true,
  },
];

export type SponsorPackage = {
  id: string;
  name: string;
  price: number;
  description: string;
  benefits: string[];
  highlighted?: boolean;
};

/** Sample sponsor tiers — replace when packages are finalized. */
export const sponsorPackages: SponsorPackage[] = [
  {
    id: "visionary",
    name: "Visionary Partner",
    price: 500,
    description: "Show your support for Southeast Texas creatives.",
    benefits: [
      "Logo on event website",
      "Social media thank-you",
      "2 general admission tickets",
    ],
  },
  {
    id: "community",
    name: "Community Champion",
    price: 1500,
    description: "Amplify your brand at SETVA 2026.",
    benefits: [
      "Logo on website & program",
      "Stage acknowledgment",
      "4 VIP tickets",
      "Vendor booth option",
    ],
    highlighted: true,
  },
  {
    id: "legacy",
    name: "Legacy Impact Partner",
    price: 5000,
    description: "Lead the movement honoring visionary talent.",
    benefits: [
      "Presenting partner recognition",
      "Premium logo placement",
      "8 VIP tickets + reserved table",
      "Speaking moment (subject to approval)",
      "Year-round partner spotlight",
    ],
  },
  {
    id: "custom",
    name: "Custom Partnership",
    price: 0,
    description: "Let's design a package that fits your goals.",
    benefits: [
      "Tailored benefits",
      "Multi-year options",
      "In-kind partnerships welcome",
    ],
  },
];

export const donationAmounts = [25, 50, 100, 250, 500] as const;

export type ScheduleItem = {
  day: string;
  time: string;
  title: string;
  description: string;
  location?: string;
};

export const eventSchedule: ScheduleItem[] = [
  {
    day: "Saturday, August 8, 2026",
    time: "12:00 PM – 3:00 PM",
    title: "Day-of Ticket Sales",
    description:
      "Purchase day-of tickets at the Jefferson Theater Box Office while supplies last.",
    location: "Jefferson Theater Box Office",
  },
  {
    day: "Saturday, August 8, 2026",
    time: "5:00 PM",
    title: "Southeast Texas Visionary Awards",
    description:
      "Red carpet, honoree presentations, and celebration honoring visionary talent across Southeast Texas.",
    location: "Jefferson Theater",
  },
];

export type Nominee = {
  id: string;
  name: string;
  category: string;
  city: string;
  bio: string;
};

/** Placeholder honorees — swap for real nominees when announced. */
export const nominees: Nominee[] = [
  {
    id: "1",
    name: "Marcus J. Williams",
    category: "Music & Arts",
    city: "Beaumont",
    bio: "Sample bio — community performer uplifting youth through workshops.",
  },
  {
    id: "2",
    name: "Dr. Aisha Coleman",
    category: "Healthcare & Service",
    city: "Port Arthur",
    bio: "Sample bio — clinic founder expanding access in underserved neighborhoods.",
  },
  {
    id: "3",
    name: "The Rivera Collective",
    category: "Community Leadership",
    city: "Orange",
    bio: "Sample bio — grassroots organizers behind neighborhood restoration projects.",
  },
  {
    id: "4",
    name: 'James "JT" Thompson',
    category: "Education & Youth",
    city: "Beaumont",
    bio: "Sample bio — mentor and coach known for 409 youth empowerment programs.",
  },
  {
    id: "5",
    name: "Elena Vasquez",
    category: "Entrepreneurship",
    city: "Nederland",
    bio: "Sample bio — small-business advocate creating jobs across Southeast Texas.",
  },
  {
    id: "6",
    name: "Pastor D. Mitchell",
    category: "Faith & Healing",
    city: "Beaumont",
    bio: "Sample bio — spiritual leader bridging faith communities and recovery support.",
  },
];

export type VendorPackage = {
  id: string;
  name: string;
  price: number;
  size: string;
  includes: string[];
};

/** Sample vendor booth pricing. */
export const vendorPackages: VendorPackage[] = [
  {
    id: "standard",
    name: "Standard Booth",
    price: 350,
    size: "10×10 ft",
    includes: ["1 day festival floor", "1 table & 2 chairs", "Listing on website"],
  },
  {
    id: "premium",
    name: "Premium Booth",
    price: 600,
    size: "10×20 ft",
    includes: [
      "Weekend festival floor",
      "Power access",
      "Social shout-out",
      "2 GA tickets",
    ],
  },
  {
    id: "food",
    name: "Food Truck / Concession",
    price: 850,
    size: "Dedicated lane",
    includes: [
      "High-traffic placement",
      "Weekend access",
      "Health permit coordination support",
    ],
  },
];

export const faqItems = [
  {
    q: "What do tickets cost?",
    a: "Early Bird $25, General Admission $30, Couples Discount $50, and Day-of tickets $40 (sold 12:00 PM – 3:00 PM at the Jefferson Theater Box Office on show day). The Awards show is August 8, 2026 at 5:00 PM.",
  },
  {
    q: "Can I buy tickets at the door?",
    a: "Yes — day-of tickets are $40 and available from 12:00 PM to 3:00 PM at the Jefferson Theater Box Office on the day of the Awards show, while supplies last.",
  },
  {
    q: "Where is the event?",
    a: "Jefferson Theater, Beaumont, Texas — August 8, 2026 at 5:00 PM.",
  },
  {
    q: "How does the Ticket Partner program work?",
    a: "Partners earn 20% commission on tickets sold through their custom link. Contact us to get your partner code (sample policy).",
  },
  {
    q: "Can I sponsor without paying online?",
    a: "Yes. Use the Custom Partnership option or email setvaawards@gmail.com for an invoice.",
  },
  {
    q: "Are donations tax-deductible?",
    a: "Placeholder — confirm nonprofit status with your tax advisor before claiming deductions.",
  },
] as const;

export const ticketPartnerInfo = {
  commissionPercent: 20,
  steps: [
    "Request your custom ticket link or promo code from the SETVA team.",
    "Share with your network — family, church, business, social media.",
    "Every sale through your link is tracked to your account.",
    "Receive your commission payout after the event (sample timeline: within 30 days).",
  ],
  sampleEarnings: [
    { tickets: 20, tier: "Early Bird ($25)", earnings: 100 },
    { tickets: 15, tier: "General ($30)", earnings: 90 },
    { tickets: 8, tier: "Couples ($50)", earnings: 80 },
  ],
};
