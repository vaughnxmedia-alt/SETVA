import { site } from "@/lib/site";

export const volunteerCategoryOptions = [
  "Pre-Event Volunteer",
  "Event Day Volunteer",
  "Post-Event Volunteer",
] as const;

export const availabilityWindowOptions = [
  "Weekdays",
  "Weekends",
  "Mornings",
  "Afternoons",
  "Evenings",
  "August 8, 2026 event day",
  "Post-event week",
] as const;

export const preEventInterestOptions = [
  "Outreach calls",
  "Sponsor support",
  "Nominee communication",
  "Packet preparation",
  "Credential preparation",
  "Decor preparation",
  "Social media support",
  "Administrative support",
] as const;

export const eventDayInterestOptions = [
  "Guest check-in",
  "VIP check-in",
  "Red carpet support",
  "Media check-in",
  "Backstage runner",
  "Usher",
  "Wayfinding",
  "Vendor support",
  "Green room support",
  "Production assistant",
  "Volunteer hospitality",
  "Setup crew",
  "Breakdown crew",
] as const;

export const postEventInterestOptions = [
  "Thank-you calls",
  "Sponsor follow-up",
  "Photo/video organization",
  "Recap support",
  "Survey follow-up",
  "Cleanup",
  "Inventory return",
  "Testimonial collection",
] as const;

export const volunteerStatusOptions = [
  "Pending Review",
  "Approved",
  "Approved with Restrictions",
  "Waitlisted",
  "Denied",
  "Confirmed",
  "Checked In",
  "Completed",
  "No Show",
] as const;

export const assignedCategoryOptions = [
  "Pre-Event",
  "Event Day",
  "Post-Event",
] as const;

export const volunteerRoleOptions = [
  "Guest Check-In",
  "VIP Check-In",
  "Media Check-In",
  "Red Carpet Support",
  "Production Assistant",
  "Runner",
  "Usher",
  "Sponsor Support",
  "Setup Crew",
  "Breakdown Crew",
  "Post-Event Follow-Up",
  "Wayfinding",
  "Vendor Support",
  "Volunteer Hospitality",
] as const;

export const orientationStatusOptions = [
  "Not scheduled",
  "Scheduled",
  "Completed",
] as const;

export type VolunteerCategory = (typeof volunteerCategoryOptions)[number];
export type VolunteerStatus = (typeof volunteerStatusOptions)[number];
export type AssignedCategory = (typeof assignedCategoryOptions)[number];
export type VolunteerRole = (typeof volunteerRoleOptions)[number];

export type VolunteerRegistrationData = {
  fullName: string;
  phone: string;
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  previousExperience: string;
  relevantSkills: string;
  notes: string;
  birthday: string;
  volunteerCategories: VolunteerCategory[];
  preEventInterests: string[];
  eventDayInterests: string[];
  postEventInterests: string[];
  availabilityWindows: string[];
  agreementAccepted: boolean;
};

export type VolunteerAdminFields = {
  status: VolunteerStatus;
  assignedRole: string;
  assignedCategory: string;
  shiftDate: string;
  shiftTime: string;
  reportTime: string;
  reportLocation: string;
  supervisorName: string;
  internalNotes: string;
  orientationStatus: string;
  dressCode: string;
  parkingCheckInInstructions: string;
  conductExpectations: string;
  confirmedArrivalTime: string;
};

export type VolunteerPostEventFields = {
  completedShift: boolean;
  supervisorNotes: string;
  thankYouEmailSent: boolean;
  eligibleForFutureList: boolean;
  volunteerHoursCompleted: string;
};

export type VolunteerRegistration = VolunteerRegistrationData &
  VolunteerAdminFields &
  VolunteerPostEventFields & {
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

function normalizeList(value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => allowed.includes(item));
}

export function defaultVolunteerAdminFields(): VolunteerAdminFields {
  return {
    status: "Pending Review",
    assignedRole: "",
    assignedCategory: "",
    shiftDate: site.event.dateLabel,
    shiftTime: "",
    reportTime: "",
    reportLocation: site.event.venue,
    supervisorName: "",
    internalNotes: "",
    orientationStatus: "Not scheduled",
    dressCode: "Black attire preferred. Comfortable closed-toe shoes required.",
    parkingCheckInInstructions: "",
    conductExpectations:
      "Represent SETVA with professionalism, follow staff instructions, and prioritize guest experience at all times.",
    confirmedArrivalTime: "",
  };
}

export function defaultVolunteerPostEventFields(): VolunteerPostEventFields {
  return {
    completedShift: false,
    supervisorNotes: "",
    thankYouEmailSent: false,
    eligibleForFutureList: false,
    volunteerHoursCompleted: "",
  };
}

function normalizeBirthday(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return "";
  const date = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (date > today) return "";
  return trimmed;
}

export function slugifyVolunteerStatus(status: string): string {
  return status.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function parseVolunteerBody(
  body: Record<string, unknown>,
): { data: VolunteerRegistrationData } | { error: string } {
  const fullName = normalizeText(body.fullName, 120);
  const phone = normalizeText(body.phone, 40);
  const email = normalizeText(body.email, 254).toLowerCase();
  const emergencyContactName = normalizeText(body.emergencyContactName, 120);
  const emergencyContactPhone = normalizeText(body.emergencyContactPhone, 40);
  const previousExperience = normalizeText(body.previousExperience, 2000);
  const relevantSkills = normalizeText(body.relevantSkills, 1000);
  const notes = normalizeText(body.notes, 2000);
  const birthday = normalizeBirthday(body.birthday);
  const volunteerCategories = normalizeList(
    body.volunteerCategories,
    volunteerCategoryOptions,
  ) as VolunteerCategory[];
  const preEventInterests = normalizeList(body.preEventInterests, preEventInterestOptions);
  const eventDayInterests = normalizeList(body.eventDayInterests, eventDayInterestOptions);
  const postEventInterests = normalizeList(
    body.postEventInterests,
    postEventInterestOptions,
  );
  const availabilityWindows = normalizeList(
    body.availabilityWindows,
    availabilityWindowOptions,
  );
  const agreementAccepted = body.agreementAccepted === true;

  if (!fullName) return { error: "Full name is required" };
  if (!phone) return { error: "Phone number is required" };
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { error: "A valid email address is required" };
  }
  if (!emergencyContactName) return { error: "Emergency contact name is required" };
  if (!emergencyContactPhone) {
    return { error: "Emergency contact phone number is required" };
  }
  if (!birthday) {
    return { error: "A valid birthday is required" };
  }
  if (volunteerCategories.length === 0) {
    return { error: "Select at least one volunteer category" };
  }
  if (availabilityWindows.length === 0) {
    return { error: "Select at least one availability window" };
  }
  if (!agreementAccepted) {
    return { error: "You must accept the volunteer agreement" };
  }

  return {
    data: {
      fullName,
      phone,
      email,
      emergencyContactName,
      emergencyContactPhone,
      previousExperience,
      relevantSkills,
      notes,
      birthday,
      volunteerCategories,
      preEventInterests,
      eventDayInterests,
      postEventInterests,
      availabilityWindows,
      agreementAccepted,
    },
  };
}

export function parseVolunteerAdminUpdate(body: Record<string, unknown>): {
  admin: Partial<VolunteerAdminFields>;
  postEvent: Partial<VolunteerPostEventFields>;
} {
  const admin: Partial<VolunteerAdminFields> = {};
  const postEvent: Partial<VolunteerPostEventFields> = {};

  if (typeof body.status === "string") {
    if (volunteerStatusOptions.includes(body.status as VolunteerStatus)) {
      admin.status = body.status as VolunteerStatus;
    }
  }

  if (typeof body.assignedRole === "string") {
    admin.assignedRole = normalizeText(body.assignedRole, 120);
  }
  if (typeof body.assignedCategory === "string") {
    admin.assignedCategory = normalizeText(body.assignedCategory, 80);
  }
  if (typeof body.orientationStatus === "string") {
    admin.orientationStatus = normalizeText(body.orientationStatus, 80);
  }

  const adminTextFields = [
    "shiftDate",
    "shiftTime",
    "reportTime",
    "reportLocation",
    "supervisorName",
    "internalNotes",
    "dressCode",
    "parkingCheckInInstructions",
    "conductExpectations",
    "confirmedArrivalTime",
  ] as const satisfies readonly (keyof VolunteerAdminFields)[];

  for (const key of adminTextFields) {
    if (typeof body[key] === "string") {
      admin[key] = normalizeText(body[key], key === "internalNotes" ? 5000 : 1000);
    }
  }

  if (typeof body.completedShift === "boolean") {
    postEvent.completedShift = body.completedShift;
  }
  if (typeof body.thankYouEmailSent === "boolean") {
    postEvent.thankYouEmailSent = body.thankYouEmailSent;
  }
  if (typeof body.eligibleForFutureList === "boolean") {
    postEvent.eligibleForFutureList = body.eligibleForFutureList;
  }
  if (typeof body.supervisorNotes === "string") {
    postEvent.supervisorNotes = normalizeText(body.supervisorNotes, 2000);
  }
  if (typeof body.volunteerHoursCompleted === "string") {
    postEvent.volunteerHoursCompleted = normalizeText(body.volunteerHoursCompleted, 40);
  }

  return { admin, postEvent };
}

export const volunteerAgreementText =
  "I understand that submitting this form does not guarantee volunteer placement and that all volunteers must follow SETVA staff instructions, event policies, and professional conduct expectations.";

export const volunteerSuccessMessage =
  "Your volunteer registration has been submitted. Our team will review your availability and contact you with next steps.";

export function volunteerDashboardSummary(
  registrations: VolunteerRegistration[],
): Record<string, number> {
  const counts: Record<string, number> = {
    total: registrations.length,
    pending: 0,
    approved: 0,
    confirmed: 0,
    checkedIn: 0,
    completed: 0,
    noShows: 0,
  };

  for (const reg of registrations) {
    const status = reg.status;
    if (status === "Pending Review") counts.pending += 1;
    if (status === "Approved" || status === "Approved with Restrictions") {
      counts.approved += 1;
    }
    if (status === "Confirmed") counts.confirmed += 1;
    if (status === "Checked In") counts.checkedIn += 1;
    if (status === "Completed") counts.completed += 1;
    if (status === "No Show") counts.noShows += 1;
  }

  return counts;
}
