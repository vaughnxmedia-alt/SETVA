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
    sponsorshipDeadline: "July 20, 2026",
    sponsorshipPaymentDue: "July 20, 2026",
  },
  contact: {
    email: "contactus@setvawards.com",
    phone: "318-592-1768",
    phoneHref: "tel:+13185921768",
    whatsapp: "https://wa.me/13185921768",
  },
  social: {
    facebook: "https://www.facebook.com/share/18hKrFpeir/?mibextid=wwXIfr",
    instagram: "https://www.instagram.com/setvaawards",
    /** On-site link hub (replaces Linktree in SETVA navigation). */
    hub: "/links",
  },
  founders: "Solomon and Tierrene' Ajao",
  org: "African Vue Corporation",
  sponsorPayment: {
    policyNote:
      "Sponsorships are paid electronically through secure checkout. Cash, checks, and money orders are not accepted online.",
    checkPayableTo: "African Vue Corporation",
    checkMemoHint: "SETVA 2026 Sponsorship — include your company name",
    checkMailingNote:
      "Mail your check or money order to the address we provide by email, or schedule an in-person drop-off. Cash payments are not accepted.",
    meetingFollowUpNote:
      "Our team will contact you within 2 business days to schedule your check or money order pickup or drop-off meeting. Cash is not accepted.",
  },
} as const;

/** SETVA wordmark — dark ink on light backgrounds, white on dark backgrounds. */
export const brandLogos = {
  onLight: "/setva-logo-header-transparent.png",
  onDark: "/setva-logo-white-transparent.png",
} as const;

/** Mont City Network — SETVA live stream & production partner (SETX). */
export const montCityNetwork = {
  name: "Mont City Network",
  tagline: "A network for culture, building a better future.",
  description:
    "A new Southeast Texas network centered on the untold stories of visionaries in our area.",
  liveStreamNote: "SETVA 2026 streams live on Mont City Network.",
  logos: {
    /** White logo for dark backgrounds */
    light: "/partners/mont-city-network-logo-light.png",
    /** Dark logo for light backgrounds */
    dark: "/partners/mont-city-network-logo-dark.png",
  },
  productionServices:
    "commercial production and marketing strategy services",
  maxProductionDiscount: 75,
} as const;

export function montCityProductionBenefit(percent: number): string {
  return `Up to ${percent}% off Mont City Network ${montCityNetwork.productionServices} (tier-based)`;
}

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/nominations", label: "Nominations" },
  // Visionary Magazine hidden from the public site while assets are built in Headquarters.
  // Re-enable by uncommenting; the /magazine route and all backend data remain intact.
  // { href: "/magazine", label: "Visionary Magazine" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/contact", label: "Contact" },
] as const;

export const footerNav = [
  { href: "/nominations", label: "Nominations" },
  // Visionary Magazine hidden from the public site while assets are built in Headquarters.
  // Re-enable by uncommenting; the /magazine route and all backend data remain intact.
  // { href: "/magazine", label: "Visionary Magazine" },
  { href: "/ticket-partners", label: "Ticket Partners" },
  { href: "/media-credentials", label: "Media Credentials" },
  { href: "/volunteer", label: "Volunteer" },
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
  /** Regular price — shown as comparison during pre-sale. */
  compareAtPrice?: number;
  /** Online checkout disabled until pre-sales open. */
  saleOpensAt?: string;
};

export const ticketPresale = {
  startLabel: "June 18, 2026",
  endLabel: "June 24, 2026",
  /** 9:00 AM CDT */
  startsAt: "2026-06-18T14:00:00.000Z",
  /** End of June 24, 2026 Central */
  endsAt: "2026-06-25T05:00:00.000Z",
} as const;

type TicketTierCatalogItem = {
  id: string;
  name: string;
  presalePrice: number;
  regularPrice: number;
  description: string;
  presaleDescription: string;
  perks: string[];
  highlighted?: boolean;
};

const ticketTierCatalog: TicketTierCatalogItem[] = [
  {
    id: "preferred",
    name: "Preferred Seating",
    presalePrice: 25,
    regularPrice: 30,
    description: "Reserved preferred seating for the Southeast Texas Visionary Awards.",
    presaleDescription:
      "Pre-sale pricing through June 24 — save before prices go up.",
    perks: ["Awards show admission", "Preferred seating"],
  },
  {
    id: "vip",
    name: "VIP",
    presalePrice: 40,
    regularPrice: 50,
    description:
      "VIP includes red carpet access, premium seating, and lounge entry.",
    presaleDescription:
      "Pre-sale VIP access through June 24 — red carpet, premium seating, and lounge entry.",
    perks: ["Red carpet access", "Premium seating", "VIP lounge entry"],
    highlighted: true,
  },
];

export function isTicketPresaleActive(now = new Date()): boolean {
  const start = new Date(ticketPresale.startsAt);
  const end = new Date(ticketPresale.endsAt);
  return now >= start && now < end;
}

export function isTicketSaleOpen(now = new Date()): boolean {
  return now.getTime() >= new Date(ticketPresale.startsAt).getTime();
}

export function ticketSaleClosedMessage(): string {
  return `Online ticket pre-sales open ${ticketPresale.startLabel}.`;
}

export function getTicketTiers(now = new Date()): TicketTier[] {
  const presale = isTicketPresaleActive(now);
  const saleOpen = isTicketSaleOpen(now);

  return ticketTierCatalog.map((tier) => ({
    id: tier.id,
    name: tier.name,
    price: presale || !saleOpen ? tier.presalePrice : tier.regularPrice,
    compareAtPrice: presale || !saleOpen ? tier.regularPrice : undefined,
    description: presale || !saleOpen ? tier.presaleDescription : tier.description,
    perks: tier.perks,
    highlighted: tier.highlighted,
    saleOpensAt: saleOpen ? undefined : ticketPresale.startsAt,
  }));
}

export function getTicketTierById(
  id: string,
  now = new Date(),
): TicketTier | undefined {
  return getTicketTiers(now).find((tier) => tier.id === id);
}

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
  /** Max sponsors for this package. Omit for unlimited. */
  maxAvailable?: number;
  /** Custom image in /public, e.g. /sponsors/packages/red-carpet-step-repeat.png */
  image?: string;
  /** Short line describing the visual placement sponsors receive. */
  visualCaption?: string;
  visualTheme?:
    | "title"
    | "legacy"
    | "stage"
    | "red-carpet"
    | "livestream"
    | "magazine"
    | "community"
    | "category"
    | "supporter"
    | "default";
  /** Show Mont City Network media / production partner branding on this package. */
  montCityMedia?: boolean;
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
    maxAvailable: 1,
    visualTheme: "title",
    visualCaption: '"Presented by [Your Brand]" across stage, press, and all event materials.',
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
      montCityProductionBenefit(75),
    ],
  },
  {
    id: "legacy-sponsor",
    name: "Legacy Sponsor",
    price: 7500,
    group: "main",
    maxAvailable: 2,
    visualTheme: "legacy",
    visualCaption: "Premium logo placement on stage, red carpet, and event collateral.",
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
      montCityProductionBenefit(65),
    ],
  },
  {
    id: "gold-visionary",
    name: "Gold Visionary Sponsor",
    price: 3500,
    group: "main",
    maxAvailable: 8,
    visualTheme: "stage",
    visualCaption: "Logo on marketing materials, website, and stage acknowledgment.",
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
      montCityProductionBenefit(50),
    ],
    highlighted: true,
    featured: true,
  },
  {
    id: "silver-impact",
    name: "Silver Impact Sponsor",
    price: 1500,
    group: "main",
    maxAvailable: 12,
    visualTheme: "stage",
    visualCaption: "Enhanced recognition on event materials and the SETVA website.",
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
    visualTheme: "community",
    visualCaption: "Community partner listing in the official program and on setvawards.com.",
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
    maxAvailable: 1,
    image: "/sponsors/packages/red-carpet-step-repeat.png",
    visualTheme: "red-carpet",
    visualCaption: "Your logo on the step-and-repeat backdrop in every red carpet photo.",
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
      montCityProductionBenefit(25),
    ],
    montCityMedia: true,
    featured: true,
  },
  {
    id: "fashion-show",
    name: "Fashion Show Sponsor",
    price: 3000,
    group: "signature",
    maxAvailable: 1,
    visualTheme: "stage",
    visualCaption: "Brand visibility on event screens during the fashion showcase segment.",
    description: "Own one of the most visual and shareable moments of the night.",
    pitch: "Connect your brand to a high-impact, camera-ready showcase moment.",
    bestFit:
      "Boutiques, designers, beauty brands, salons, modeling agencies, and retail businesses.",
    benefits: [
      "Stage mention during the fashion segment",
      "Logo on event screens during the showcase",
      "Social media feature (2 posts + 1 reel)",
      "Product or brand placement opportunity (subject to approval)",
      montCityProductionBenefit(25),
    ],
    montCityMedia: true,
  },
  {
    id: "trophy",
    name: "Trophy Sponsor",
    price: 2500,
    group: "signature",
    maxAvailable: 1,
    visualTheme: "stage",
    visualCaption: "Logo at the trophy presentation area and in winner photo moments.",
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
    maxAvailable: 1,
    visualTheme: "livestream",
    visualCaption: `Exclusive broadcast on ${montCityNetwork.name} — pre-roll, lower-thirds, and host mentions.`,
    montCityMedia: true,
    description:
      "Reach audiences inside the theatre and across Southeast Texas on Mont City Network.",
    pitch:
      "Your brand rides along with the region's new home for visionary stories — live on Mont City Network.",
    bestFit:
      "Tech, media, telecom, production, and digital brands seeking expanded reach.",
    benefits: [
      `Exclusive SETVA 2026 live stream on ${montCityNetwork.name}`,
      "Pre-roll sponsor slide on the broadcast",
      "Lower-third logo placement during the stream",
      "Host mention during the live stream",
      "Logo on Mont City Network stream landing page",
      "15-second sponsor commercial spot option",
      montCityProductionBenefit(25),
    ],
    featured: true,
  },
  {
    id: "visionary-award",
    name: "Visionary Award Sponsor",
    price: 2500,
    group: "signature",
    maxAvailable: 1,
    visualTheme: "stage",
    visualCaption: '"Visionary of the Year presented by [Your Brand]" on stage and screens.',
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
    maxAvailable: 1,
    visualTheme: "stage",
    visualCaption: "Lounge naming, signage, and branded photo moments for VIP guests.",
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
    maxAvailable: 2,
    visualTheme: "magazine",
    visualCaption: "Full or half-page ad plus logo on the magazine sponsor page.",
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
    maxAvailable: 1,
    visualTheme: "community",
    visualCaption: "Stage acknowledgment tied to the community impact recognition segment.",
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
    maxAvailable: 1,
    visualTheme: "community",
    visualCaption: "Youth honoree segment sponsorship with stage and social spotlight.",
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
    maxAvailable: 4,
    visualTheme: "livestream",
    visualCaption: `Cross-promotion on SETVA channels and ${montCityNetwork.name}.`,
    montCityMedia: true,
    description:
      "Public alignment with SETVA and Mont City Network — Southeast Texas' home for visionary culture.",
    pitch:
      "Put your platform behind the stories Southeast Texas is celebrating — on stage and on the network.",
    bestFit:
      "Radio, podcasts, blogs, online TV, photographers, videographers, and media personalities.",
    benefits: [
      "Logo on media partner wall and website",
      `Feature on ${montCityNetwork.name} partner channels`,
      "Cross-promotion on SETVA channels (2 posts)",
      "Program listing as official media partner",
      "Red carpet and recap content tags",
      montCityProductionBenefit(25),
    ],
  },
  {
    id: "category-sponsor",
    name: "Category Sponsor",
    price: 250,
    group: "signature",
    maxAvailable: 12,
    visualTheme: "category",
    visualCaption: '"Best [Category] presented by [Your Brand]" on stage and in the program.',
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
    visualTheme: "supporter",
    visualCaption: "Supporter listing on the website and in the event program.",
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
      "Organizations needing a bespoke package, electronic billing, or combined sponsorship levels.",
    benefits: [
      "Tailored benefits across main and signature tiers",
      "Multi-year partnership options",
      "In-kind media and vendor partnerships welcome",
      "Pay electronically through secure checkout",
    ],
    contactOnly: true,
  },
];

export function sortSponsorPackagesByPrice(packages: SponsorPackage[]): SponsorPackage[] {
  return [...packages].sort((a, b) => {
    if (a.contactOnly !== b.contactOnly) {
      return a.contactOnly ? 1 : -1;
    }
    return a.price - b.price;
  });
}

export const SPONSOR_TITLE_PACKAGE_ID = "title-sponsor";

export const sponsorTitlePackage = sponsorPackages.find(
  (pkg) => pkg.id === SPONSOR_TITLE_PACKAGE_ID,
)!;

export const sponsorMainPackages = sortSponsorPackagesByPrice(
  sponsorPackages.filter(
    (pkg) => pkg.group === "main" && pkg.id !== SPONSOR_TITLE_PACKAGE_ID,
  ),
);

export const sponsorMediaPackages = sortSponsorPackagesByPrice(
  sponsorPackages.filter((pkg) => pkg.group === "signature" && pkg.montCityMedia),
);

export const sponsorNonMediaSignaturePackages = sortSponsorPackagesByPrice(
  sponsorPackages.filter((pkg) => pkg.group === "signature" && !pkg.montCityMedia),
);

export const sponsorSignaturePackages = sortSponsorPackagesByPrice(
  sponsorPackages.filter((pkg) => pkg.group === "signature"),
);

export const sponsorSupporterPackages = sortSponsorPackagesByPrice(
  sponsorPackages.filter((pkg) => pkg.group === "supporter"),
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
      "Red carpet, honoree presentations, and celebration honoring visionary talent across Southeast Texas. Live stream on Mont City Network.",
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

/** Static honoree list — nominations on the live site come from Headquarters. */
export const nominees: Nominee[] = [];

export type VendorPackage = {
  id: string;
  name: string;
  price: number;
  size: string;
  includes: string[];
};

export const vendorSlotOptions = [
  {
    id: "vendor-bartenders",
    label: "Bartenders",
    description:
      "Limited bartender slots — non-alcoholic beverages only (mocktails, sodas, coffee, and specialty NA drinks).",
    availability: "Limited availability",
  },
  {
    id: "vendor-food-truck",
    label: "Food Truck",
    description: "One food truck slot at SETVA 2026.",
    availability: "1 slot available",
  },
  {
    id: "vendor-spinning-camera",
    label: "Spinning Camera",
    description: "360 photo / spinner booth placement.",
    availability: "1 slot available",
  },
] as const;

/** Vendor booth pricing for online checkout. */
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
    a: "Pre-sale (June 18–24, 2026): VIP $40 and Preferred Seating $25. After June 24: VIP $50 and Preferred Seating $30. The Awards show is August 8, 2026 at 5:00 PM at the Jefferson Theater in Beaumont.",
  },
  {
    q: "Can I buy tickets at the door?",
    a: "Online pre-sales run June 18–24, 2026, then continue at regular pricing. For day-of availability, contact contactus@setvawards.com or check back closer to the event.",
  },
  {
    q: "Where is the event?",
    a: "Jefferson Theater, Beaumont, Texas — August 8, 2026 at 5:00 PM.",
  },
  {
    q: "How does the Ticket Partner program work?",
    a: "Partners earn 10% commission on tickets sold through their custom link. Contact us to get your partner code.",
  },
  {
    q: "What sponsorship packages are available?",
    a: "SETVA 2026 offers Title ($15,000), Legacy ($7,500), Gold Visionary ($3,500), Silver Impact ($1,500), Bronze Community ($750), plus signature opportunities from Red Carpet to Category Sponsor ($250). See the Sponsors page or request the Torch of Excellence deck by email.",
  },
  {
    q: "Where can I watch the live stream?",
    a: "SETVA 2026 streams live on Mont City Network — a new Southeast Texas network telling the untold stories of visionaries in our area. Sponsor the live stream package for broadcast visibility and commercial placement opportunities.",
  },
  {
    q: "Are sponsorship packages limited?",
    a: "Yes. Exclusive opportunities like Title Sponsor, Red Carpet, Live Stream, and VIP Lounge are limited to one partner each. Other tiers have defined slot counts shown on the Sponsors page. When a package sells out, you can join the waitlist by email.",
  },
  {
    q: "Can I sponsor without paying online?",
    a: "Yes. Pay electronically through secure checkout. Cash, checks, and money orders are not accepted online. For Title, Legacy, or custom packages, email contactus@setvawards.com or use the Custom Partnership option.",
  },
  {
    q: "Are donations tax-deductible?",
    a: "Donations support SETVA programming. Confirm tax-deductibility with your tax advisor before claiming deductions.",
  },
] as const;

export const ticketPartnerInfo = {
  commissionPercent: 10,
  registrationOpensLabel: "June 18, 2026 at 9:00 AM Central",
  /** 9:00 AM CDT on June 18, 2026 */
  registrationOpensAt: "2026-06-18T14:00:00.000Z",
  steps: [
    "Request your custom ticket link or promo code from the SETVA team.",
    "Share with your network — family, church, business, social media.",
    "Every sale through your link is tracked to your account.",
    "Receive your commission payout within 30 days after the event.",
  ],
};

export type SocialHubLink = {
  label: string;
  description?: string;
  href: string;
  external?: boolean;
};

export const socialHub = {
  title: "SETVA",
  bio: "Celebrating excellence in music, film, fashion, art & culture across the 409.",
  tagline: "Get tickets · Vote · Be there when the vision takes stage!",
  logo: "/setva-logo-2026.png",
  primaryLink: {
    label: "Get Tickets",
    description: "VIP & Preferred Seating — August 8, 2026",
    href: "/tickets",
  },
  links: [
    {
      label: "Volunteer Registration",
      description: "Serve at SETVA 2026",
      href: "/volunteer",
    },
    {
      label: "Media Credentials",
      description: "Red carpet press & creator access",
      href: "/media-credentials",
    },
    {
      label: "Vendor Slots",
      description: "NA bartenders, food truck, spinning camera & more",
      href: "/vendors",
    },
    {
      label: "Become a Sponsor",
      description: "Torch of Excellence packages",
      href: "/sponsors",
    },
    {
      label: "Donate",
      description: "Support the SETVA vision",
      href: "/donate",
    },
  ] satisfies SocialHubLink[],
  recapVideo: {
    label: "SETVA Awards",
    description: "Watch the SETVA awards on YouTube",
    href: "https://www.youtube.com/watch?v=KktIIA3ccUM&t=418",
    videoId: "KktIIA3ccUM",
  },
  socials: [
    { label: "Facebook", href: site.social.facebook },
    { label: "Instagram", href: site.social.instagram },
  ],
} as const;
