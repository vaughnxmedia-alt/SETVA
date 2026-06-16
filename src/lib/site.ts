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
    theme:
      "Igniting Excellence. Illuminating Visionaries. Lighting the Path Forward.",
    awardCategories: "50+",
    regions: [
      "Beaumont",
      "Port Arthur",
      "Port Neches",
      "Nederland",
      "Orange",
      "Groves",
      "Bridge City",
      "Vidor",
    ],
    sponsorshipDeadline: "July 15, 2026",
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
  { href: "/sponsors", label: "Sponsors" },
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
  group: "main" | "signature" | "supporter";
  pitch?: string;
  bestFit?: string;
  highlighted?: boolean;
  featured?: boolean;
  contactOnly?: boolean;
};

export const vipAccessSummary =
  "VIP includes red carpet access, premium seating, and lounge entry.";

/** Torch of Excellence sponsorship packages — SETVA 2026. */
export const sponsorPackages: SponsorPackage[] = [
  {
    id: "title-sponsor",
    name: "Title Sponsor",
    price: 15000,
    group: "main",
    description:
      "Become the presenting brand behind one of Southeast Texas' biggest cultural recognition moments.",
    pitch:
      "You are not just sponsoring the event — you are the name behind SETVA 2026.",
    bestFit:
      "Banks, hospital systems, major corporations, regional brands, dealerships, universities, and energy companies seeking maximum visibility.",
    benefits: [
      'Exclusive naming rights: "Presented by [Company Name]"',
      "Opening ceremony speaking opportunity",
      "Premium logo on all materials and stage",
      "Homepage feature placement",
      "Press release spotlight",
      "Red carpet branding dominance",
      "Dedicated social campaign: 8 feed posts, 4 reels, 3 email mentions, stage mentions",
      "10 VIP tickets with premium access",
      "Premium vendor space",
      "Full-page Visionaries Magazine feature",
    ],
    contactOnly: true,
  },
  {
    id: "legacy-sponsor",
    name: "Legacy Sponsor",
    price: 7500,
    group: "main",
    description:
      "High-level visibility throughout the awards experience without naming rights.",
    pitch:
      "Position your brand as a legacy-building partner in Southeast Texas.",
    bestFit:
      "Companies wanting premium brand association at a strong but more accessible investment level.",
    benefits: [
      "Prominent logo on stage and materials",
      "Stage and red carpet recognition",
      "Website and press release mentions",
      "6 dedicated social posts, 4 stories, 2 reel mentions, sponsor graphics",
      "6 VIP tickets",
      "Vendor space at the event",
      "Full-page Visionaries Magazine feature",
    ],
    contactOnly: true,
  },
  {
    id: "gold-visionary",
    name: "Gold Visionary Sponsor",
    price: 3500,
    group: "main",
    description:
      "The sweet spot for brands that want visibility, respect, and connection to regional leaders.",
    pitch:
      "Be seen and respected without investing at the top tier.",
    bestFit:
      "Small-to-mid businesses, boutiques, law firms, beauty brands, real estate, consultants, and growing companies.",
    benefits: [
      "Logo on marketing collateral and event website",
      "Stage acknowledgment during the ceremony",
      "Vendor space access",
      "3 feed posts + 2 story mentions",
      "4 VIP tickets",
      "Half-page Visionaries Magazine feature",
    ],
    highlighted: true,
    featured: true,
  },
  {
    id: "silver-impact",
    name: "Silver Impact Sponsor",
    price: 1500,
    group: "main",
    description:
      "Strong community visibility for businesses supporting SETX excellence.",
    pitch:
      "Support the mission and receive public recognition across the event.",
    bestFit:
      "Local businesses, nonprofits, service providers, photographers, agencies, and new entrepreneurs.",
    benefits: [
      "Enhanced recognition on event materials and website",
      "2 VIP tickets with premium access",
      "2 social posts + program listing",
      "Official program listing",
    ],
    featured: true,
  },
  {
    id: "bronze-community",
    name: "Bronze Community Sponsor",
    price: 750,
    group: "main",
    description:
      "The easiest way to connect your brand to SETVA and Southeast Texas excellence.",
    pitch:
      "Show public support for the region's visionaries as a community partner.",
    bestFit:
      "Individuals, micro-businesses, churches, salons, barbershops, and startup brands.",
    benefits: [
      "Acknowledgment in the official event program",
      "Website recognition",
      "1 VIP ticket",
      "Community supporter listing",
    ],
    featured: true,
  },
  {
    id: "red-carpet",
    name: "Red Carpet Sponsor",
    price: 3500,
    group: "signature",
    description: "Own the first impression — every photo moment starts here.",
    pitch:
      "Your brand becomes part of the red carpet experience guests remember.",
    bestFit:
      "Fashion, beauty, photographers, media, luxury, boutiques, salons, and lifestyle brands.",
    benefits: [
      "Logo on step-and-repeat backdrop",
      "Red carpet host mention",
      "Brand mention in red carpet interviews",
      "Social tags on red carpet recap posts (3 posts)",
      "Branded signage option near the carpet",
    ],
    featured: true,
  },
  {
    id: "fashion-show",
    name: "Fashion Show Sponsor",
    price: 3000,
    group: "signature",
    description: "Own one of the most visual and shareable moments of the night.",
    pitch: "Connect your brand to a high-impact, camera-ready showcase moment.",
    bestFit:
      "Boutiques, designers, beauty brands, salons, modeling agencies, and retail businesses.",
    benefits: [
      "Stage mention during the fashion segment",
      "Logo on event screens during the showcase",
      "Social media feature (2 posts + 1 reel)",
      "Product or brand placement opportunity (subject to approval)",
    ],
  },
  {
    id: "trophy",
    name: "Trophy Sponsor",
    price: 2500,
    group: "signature",
    description: "Tie your brand to the award moment winners never forget.",
    pitch: "Every winner's moment is connected to your brand.",
    bestFit:
      "Jewelers, banks, law firms, real estate brands, and prestige-focused companies.",
    benefits: [
      "Logo on trophy presentation area and screens",
      "Mention during award presentations",
      "Logo in printed program at trophy moments",
      "Winner photo area branding",
    ],
  },
  {
    id: "live-stream",
    name: "Live Stream Sponsor",
    price: 2500,
    group: "signature",
    description: "Reach audiences inside the theatre and everyone watching online.",
    pitch:
      "Your brand extends beyond the Jefferson Theatre to viewers across the region.",
    bestFit:
      "Tech, media, telecom, production, and digital brands seeking expanded reach.",
    benefits: [
      "Pre-roll sponsor slide on the livestream",
      "Lower-third logo placement during broadcast",
      "Host mention during the stream",
      "Logo on livestream landing page",
      "15-second sponsor spot option",
    ],
    featured: true,
  },
  {
    id: "visionary-award",
    name: "Visionary Award Sponsor",
    price: 2500,
    group: "signature",
    description:
      "Present a high-profile award tied directly to excellence and leadership.",
    pitch:
      'Your brand presents a signature moment — e.g. "Visionary of the Year presented by [Sponsor]."',
    bestFit:
      "Brands aligned with innovation, leadership, achievement, and community impact.",
    benefits: [
      "Named award presentation on stage",
      "Logo on screen during the category",
      "Program listing as presenting sponsor of the award",
      "Social feature post for the award moment",
    ],
  },
  {
    id: "vip-lounge",
    name: "VIP Lounge Sponsor",
    price: 2500,
    group: "signature",
    description: "Become part of the premium guest experience all evening.",
    pitch: "Your brand elevates the VIP experience from arrival to celebration.",
    bestFit:
      "Luxury, beverage, restaurant, beauty, real estate, banks, and lifestyle brands.",
    benefits: [
      "Lounge naming or co-branding rights",
      "Signage and branded photo moment in the lounge",
      "Product placement opportunity",
      "VIP bag insert option",
      "2 VIP tickets included",
    ],
  },
  {
    id: "visionaries-magazine",
    name: "Visionaries Magazine Sponsor",
    price: 2000,
    group: "signature",
    description: "Visibility that lives beyond event night in print and digital.",
    pitch:
      "Guests keep and revisit the magazine — your brand stays in their hands.",
    bestFit:
      "Brands that value polished storytelling and lasting print presence.",
    benefits: [
      "Full or half-page ad placement (tier-based)",
      "Logo on magazine sponsor page",
      "Digital edition sponsor mention",
      "Distribution at the event and partner outlets",
    ],
  },
  {
    id: "community-impact",
    name: "Community Impact Sponsor",
    price: 2000,
    group: "signature",
    description:
      "Show your brand is invested in the people and progress of Southeast Texas.",
    pitch: "Align with a community recognition moment that reflects your mission.",
    bestFit:
      "Nonprofits, banks, healthcare, churches, civic groups, schools, and service organizations.",
    benefits: [
      "Tied to a community impact award or recognition segment",
      "Stage acknowledgment during the category",
      "Website and program feature",
      "2 social posts highlighting community partnership",
    ],
  },
  {
    id: "youth-excellence",
    name: "Youth Excellence Sponsor",
    price: 2000,
    group: "signature",
    description: "Invest in the next generation of Southeast Texas leaders.",
    pitch: "Champion youth honorees and the future of the 409.",
    bestFit:
      "Schools, colleges, youth programs, family brands, mentorship programs, and education organizations.",
    benefits: [
      "Youth honoree recognition segment sponsorship",
      "Stage mention during youth awards",
      "Website and social youth spotlight (3 posts)",
      "Program feature as youth excellence partner",
    ],
    featured: true,
  },
  {
    id: "media-sponsor",
    name: "Media Sponsor",
    price: 1500,
    group: "signature",
    description:
      "Public alignment with one of the region's most visible awards experiences.",
    pitch: "Put your platform behind the stories Southeast Texas is celebrating.",
    bestFit:
      "Radio, podcasts, blogs, online TV, photographers, videographers, and media personalities.",
    benefits: [
      "Logo on media partner wall and website",
      "Cross-promotion on SETVA channels (2 posts)",
      "Program listing as official media partner",
      "Red carpet and recap content tags",
    ],
  },
  {
    id: "category-sponsor",
    name: "Category Sponsor",
    price: 250,
    group: "signature",
    description: "Put your name behind a category that aligns with your brand.",
    pitch:
      'Affordable visibility — e.g. "Best Photographer presented by [Brand]."',
    bestFit:
      "Small businesses, supporters, nominees' families, and community leaders.",
    benefits: [
      "Named category presentation on stage",
      "Program listing for your sponsored category",
      "Website category sponsor credit",
      "1 social shout-out",
    ],
  },
  {
    id: "torch-supporter",
    name: "Torch Supporter",
    price: 100,
    group: "supporter",
    description:
      "A simple way for supporters to help bring the SETVA vision to life.",
    pitch: "Be counted among the friends and champions of SETVA 2026.",
    bestFit: "Individuals, micro-businesses, and community members.",
    benefits: [
      "Supporter listing on website",
      "Community thank-you in program",
      "Social media supporter roll mention",
    ],
  },
  {
    id: "custom-partnership",
    name: "Custom Partnership",
    price: 0,
    group: "supporter",
    description:
      "Multi-year agreements, in-kind partnerships, or a tailored mix of benefits.",
    bestFit:
      "Organizations needing a bespoke package, invoice billing, or combined sponsorship levels.",
    benefits: [
      "Tailored benefits across main and signature tiers",
      "Multi-year partnership options",
      "In-kind media and vendor partnerships welcome",
      "Invoice and payment plan options",
    ],
    contactOnly: true,
  },
];

export const sponsorMainPackages = sponsorPackages.filter(
  (pkg) => pkg.group === "main",
);

export const sponsorSignaturePackages = sponsorPackages.filter(
  (pkg) => pkg.group === "signature",
);

export const sponsorSupporterPackages = sponsorPackages.filter(
  (pkg) => pkg.group === "supporter",
);

export const sponsorFeaturedPackages = sponsorPackages.filter(
  (pkg) => pkg.featured,
);

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
    q: "What sponsorship packages are available?",
    a: "SETVA 2026 offers Title ($15,000), Legacy ($7,500), Gold Visionary ($3,500), Silver Impact ($1,500), Bronze Community ($750), plus signature opportunities from Red Carpet to Category Sponsor ($250). See the Sponsors page or request the Torch of Excellence deck by email.",
  },
  {
    q: "Can I sponsor without paying online?",
    a: "Yes. Title and Legacy packages are confirmed by invoice. Email setvaawards@gmail.com or use the Custom Partnership option for tailored agreements.",
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
