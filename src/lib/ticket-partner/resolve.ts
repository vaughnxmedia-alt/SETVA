import { listAmbassadorRegistrations } from "@/lib/ambassadors-store";
import { listNominees } from "@/lib/nominees-store";
import { categoryTitleById, listNomineeCategories } from "@/lib/nominee-categories-store";
import type { TicketPartnerSource } from "@/lib/ticket-partner/types";

export type ResolvedTicketPartner = {
  slug: string;
  sourceType: TicketPartnerSource;
  sourceId: string;
  sourceName: string;
  category: string;
  email: string;
};

export async function resolveTicketPartnerBySlug(slug: string): Promise<ResolvedTicketPartner | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const [nominees, ambassadors, categories] = await Promise.all([
    listNominees(),
    listAmbassadorRegistrations(),
    listNomineeCategories(),
  ]);

  const nominee = nominees.find((item) => item.ticketPartnerSlug.toLowerCase() === normalized);
  if (nominee) {
    return {
      slug: nominee.ticketPartnerSlug,
      sourceType: "nominee",
      sourceId: nominee.id,
      sourceName: nominee.name,
      category: categoryTitleById(categories, nominee.categoryId),
      email: nominee.contactEmail,
    };
  }

  const ambassador = ambassadors.find((item) => item.ticketPartnerSlug.toLowerCase() === normalized);
  if (ambassador) {
    return {
      slug: ambassador.ticketPartnerSlug,
      sourceType: "ambassador",
      sourceId: ambassador.id,
      sourceName: ambassador.fullName,
      category: "Ticket Partner",
      email: ambassador.email,
    };
  }

  return null;
}

export async function ensureNomineeTicketPartnerSlug(
  nominee: { id: string; name: string; ticketPartnerSlug: string },
): Promise<string> {
  if (nominee.ticketPartnerSlug.trim()) return nominee.ticketPartnerSlug.trim();
  const { slugifyTicketPartner } = await import("@/lib/ticket-partner/links");
  return slugifyTicketPartner(nominee.name, nominee.id);
}

export async function ensureAmbassadorTicketPartnerSlug(
  ambassador: { id: string; fullName: string; ticketPartnerSlug: string },
): Promise<string> {
  if (ambassador.ticketPartnerSlug.trim()) return ambassador.ticketPartnerSlug.trim();
  const { slugifyTicketPartner } = await import("@/lib/ticket-partner/links");
  return slugifyTicketPartner(ambassador.fullName, ambassador.id);
}
