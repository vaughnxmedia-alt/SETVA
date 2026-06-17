import { montCityNetwork } from "@/lib/site";

export const coverageTypeOptions = [
  "Photography",
  "Video",
  "Interviews",
  "Social Media",
  "Podcast Coverage",
  "Recap Content",
  "Livestream Request",
] as const;

export const credentialTypeOptions = [
  "General Media",
  "Photographer",
  "Video",
  "Interview",
  "Denied",
] as const;

export const applicationStatusOptions = [
  "Pending Review",
  "Approved",
  "Approved with Restrictions",
  "Waitlisted",
  "Denied",
] as const;

export type CoverageType = (typeof coverageTypeOptions)[number];
export type CredentialType = (typeof credentialTypeOptions)[number];
export type ApplicationStatus = (typeof applicationStatusOptions)[number];

export type MediaCredentialApplicationData = {
  fullName: string;
  phone: string;
  email: string;
  cityState: string;
  mediaOutlet: string;
  website: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  facebook: string;
  totalFollowers: string;
  averageReach: string;
  teamMembers: string;
  equipment: string;
  portfolioLink: string;
  previousCoverageLink: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  additionalComments: string;
  coverageTypes: CoverageType[];
  rulesAgreed: boolean;
};

export type MediaCredentialAdminFields = {
  credentialType: CredentialType;
  status: ApplicationStatus;
  internalNotes: string;
  coverageGuidelines: string;
  checkInInstructions: string;
  parkingInformation: string;
  contactInformation: string;
  arrivalTime: string;
  pickupLocation: string;
  approvedCrewSize: string;
  credentialNumber: string;
  seatingAssignment: string;
  mediaDirectoryListing: boolean;
};

export type MediaCredentialPostEvent = {
  publishedArticles: string;
  photos: string;
  videos: string;
  socialMediaPosts: string;
  mentions: string;
};

export type MediaCredentialApplication = MediaCredentialApplicationData &
  MediaCredentialAdminFields &
  MediaCredentialPostEvent & {
    id: string;
    submittedAt: string;
    updatedAt: string;
    lastStatusEmailAt: string | null;
  };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function normalizeList(
  value: unknown,
  allowed: readonly string[],
): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => allowed.includes(item));
}

export function defaultAdminFields(): MediaCredentialAdminFields {
  return {
    credentialType: "General Media",
    status: "Pending Review",
    internalNotes: "",
    coverageGuidelines: "",
    checkInInstructions: "",
    parkingInformation: "",
    contactInformation: "",
    arrivalTime: "",
    pickupLocation: "",
    approvedCrewSize: "",
    credentialNumber: "",
    seatingAssignment: "",
    mediaDirectoryListing: false,
  };
}

export function defaultPostEventFields(): MediaCredentialPostEvent {
  return {
    publishedArticles: "",
    photos: "",
    videos: "",
    socialMediaPosts: "",
    mentions: "",
  };
}

export function parseMediaCredentialBody(
  body: Record<string, unknown>,
): { data: MediaCredentialApplicationData } | { error: string } {
  const fullName = normalizeText(body.fullName, 120);
  const phone = normalizeText(body.phone, 40);
  const email = normalizeText(body.email, 254).toLowerCase();
  const cityState = normalizeText(body.cityState, 120);
  const mediaOutlet = normalizeText(body.mediaOutlet, 160);
  const website = normalizeText(body.website, 300);
  const instagram = normalizeText(body.instagram, 120);
  const tiktok = normalizeText(body.tiktok, 120);
  const youtube = normalizeText(body.youtube, 200);
  const facebook = normalizeText(body.facebook, 200);
  const totalFollowers = normalizeText(body.totalFollowers, 80);
  const averageReach = normalizeText(body.averageReach, 120);
  const teamMembers = normalizeText(body.teamMembers, 40);
  const equipment = normalizeText(body.equipment, 1000);
  const portfolioLink = normalizeText(body.portfolioLink, 500);
  const previousCoverageLink = normalizeText(body.previousCoverageLink, 500);
  const emergencyContactName = normalizeText(body.emergencyContactName, 120);
  const emergencyContactPhone = normalizeText(body.emergencyContactPhone, 40);
  const additionalComments = normalizeText(body.additionalComments, 2000);
  const coverageTypes = normalizeList(
    body.coverageTypes,
    coverageTypeOptions,
  ) as CoverageType[];
  const rulesAgreed = body.rulesAgreed === true;

  if (!fullName) return { error: "Full name is required" };
  if (!phone) return { error: "Phone number is required" };
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: "A valid email address is required" };
  }
  if (!cityState) return { error: "City and state are required" };
  if (!mediaOutlet) return { error: "Media outlet or creator name is required" };
  if (!teamMembers) return { error: "Number of team members attending is required" };
  if (!equipment) return { error: "Equipment being brought is required" };
  if (!emergencyContactName) {
    return { error: "Emergency contact name is required" };
  }
  if (!emergencyContactPhone) {
    return { error: "Emergency contact phone number is required" };
  }
  if (coverageTypes.length === 0) {
    return { error: "Select at least one coverage type" };
  }
  if (!rulesAgreed) {
    return { error: "You must agree to the media credential rules and regulations" };
  }

  return {
    data: {
      fullName,
      phone,
      email,
      cityState,
      mediaOutlet,
      website,
      instagram,
      tiktok,
      youtube,
      facebook,
      totalFollowers,
      averageReach,
      teamMembers,
      equipment,
      portfolioLink,
      previousCoverageLink,
      emergencyContactName,
      emergencyContactPhone,
      additionalComments,
      coverageTypes,
      rulesAgreed,
    },
  };
}

export function parseMediaCredentialAdminUpdate(
  body: Record<string, unknown>,
): {
  admin: Partial<MediaCredentialAdminFields>;
  postEvent: Partial<MediaCredentialPostEvent>;
} {
  const admin: Partial<MediaCredentialAdminFields> = {};
  const postEvent: Partial<MediaCredentialPostEvent> = {};

  if (typeof body.credentialType === "string") {
    if (credentialTypeOptions.includes(body.credentialType as CredentialType)) {
      admin.credentialType = body.credentialType as CredentialType;
    }
  }

  if (typeof body.status === "string") {
    if (applicationStatusOptions.includes(body.status as ApplicationStatus)) {
      admin.status = body.status as ApplicationStatus;
    }
  }

  type AdminTextField = Exclude<
    keyof MediaCredentialAdminFields,
    "credentialType" | "status" | "mediaDirectoryListing"
  >;

  const adminTextFields = [
    "internalNotes",
    "coverageGuidelines",
    "checkInInstructions",
    "parkingInformation",
    "contactInformation",
    "arrivalTime",
    "pickupLocation",
    "approvedCrewSize",
    "credentialNumber",
    "seatingAssignment",
  ] as const satisfies readonly AdminTextField[];

  for (const key of adminTextFields) {
    if (typeof body[key] === "string") {
      admin[key] = normalizeText(body[key], key === "internalNotes" ? 5000 : 1000);
    }
  }

  if (typeof body.mediaDirectoryListing === "boolean") {
    admin.mediaDirectoryListing = body.mediaDirectoryListing;
  }

  const postEventFields: Array<keyof MediaCredentialPostEvent> = [
    "publishedArticles",
    "photos",
    "videos",
    "socialMediaPosts",
    "mentions",
  ];

  for (const key of postEventFields) {
    if (typeof body[key] === "string") {
      postEvent[key] = normalizeText(body[key], 2000);
    }
  }

  return { admin, postEvent };
}

export const mediaCredentialAccessZones = [
  {
    title: "Red Carpet",
    policy:
      "Media credentials and approved media outlets are for red carpet coverage only, unless your approval email states otherwise.",
  },
  {
    title: "Lobby",
    policy:
      "Select photographers and select videographers may be approved for lobby access. Lobby placement is by invitation only and is not included with a standard media credential.",
  },
  {
    title: "House (Show)",
    policy: `No cameras are permitted inside the house during the show except the ${montCityNetwork.name} production crew.`,
  },
] as const;

export const mediaCredentialAccessPolicySummary =
  `Standard media credentials cover the red carpet. Select photographers and videographers may be approved for the lobby. No personal or outlet cameras are allowed inside the house during the show—only the ${montCityNetwork.name} production crew.`;

export const defaultMediaCredentialCoverageGuidelines = [
  "Red Carpet: Media credentials and approved media outlets are limited to red carpet coverage unless your approval specifies additional access.",
  "Lobby: Only select photographers and select videographers approved by SETVA production may work in the lobby.",
  `House / Show: No cameras may operate inside the house during the show except the ${montCityNetwork.name} production crew.`,
  "Do not enter the auditorium or seating area with personal cameras, phones used as cameras, or other recording devices unless explicitly authorized in writing.",
  "Follow all instructions from SETVA production staff and security at all times.",
].join("\n");

export const mediaCredentialRules = [
  mediaCredentialAccessPolicySummary,
  "Red carpet media credentials do not grant lobby or house access unless your approval email explicitly includes those zones.",
  "Lobby access is limited to select photographers and select videographers invited and approved by the SETVA production team.",
  `Inside the house during the show, only the ${montCityNetwork.name} production crew may record. All other cameras must remain outside the auditorium.`,
  "Media credentials are issued at the sole discretion of the SETVA production team.",
  "Approved media must present a government-issued photo ID and approval confirmation at check-in.",
  "Crew size on site may not exceed the approved number listed in your credential email.",
  "Credentials are non-transferable and must be worn visibly in authorized areas.",
  "Livestream, drone, and specialty equipment requests require advance approval.",
  "Respect nominee privacy, production cues, and restricted backstage areas.",
  "SETVA reserves the right to revoke credentials for unprofessional conduct or policy violations.",
  "Post-event, credentialed media are encouraged to share published coverage links with the SETVA team.",
] as const;

export const mediaCredentialSuccessMessage =
  "Your media credential application has been submitted. Our team will review your request and contact you if approved.";
