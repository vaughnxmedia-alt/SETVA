import { listAmbassadorRegistrations } from "@/lib/ambassadors-store";
import { listNominees } from "@/lib/nominees-store";
import { categoryTitleById, listNomineeCategories } from "@/lib/nominee-categories-store";
import { listNomineePageEntries } from "@/lib/nominee-workflows-store";
import { slugifyTicketPartner } from "@/lib/ticket-partner/links";
import type { TicketPartnerSource } from "@/lib/ticket-partner/types";

export type ResolvedTicketPartner = {
  slug: string;
  sourceType: TicketPartnerSource;
  sourceId: string;
  sourceName: string;
  category: string;
  email: string;
};

export type NomineeVoteTarget = {
  nomineeId: string;
  pageEntryId: string;
  categoryId: string;
  categoryTitle: string;
};

/**
 * Returns every published category a nominee is nominated in, so a supporter can
 * vote for them in each. Matches by nominee name (case-insensitive) so a person
 * with multiple nominee records across categories surfaces all of them.
 */
export async function listNomineeVoteTargets(sourceName: string): Promise<NomineeVoteTarget[]> {
  const normalizedName = sourceName.trim().toLowerCase();
  if (!normalizedName) return [];

  const [nominees, categories, entries] = await Promise.all([
    listNominees(),
    listNomineeCategories(),
    listNomineePageEntries(),
  ]);

  const matchingNomineeIds = new Set(
    nominees
      .filter((nominee) => nominee.name.trim().toLowerCase() === normalizedName)
      .map((nominee) => nominee.id),
  );
  if (matchingNomineeIds.size === 0) return [];

  const seenCategories = new Set<string>();
  const targets: NomineeVoteTarget[] = [];

  for (const entry of entries) {
    if (!entry.publishToNomineePage || entry.status !== "Published") continue;
    if (!matchingNomineeIds.has(entry.nomineeId)) continue;
    if (seenCategories.has(entry.categoryId)) continue;
    seenCategories.add(entry.categoryId);
    targets.push({
      nomineeId: entry.nomineeId,
      pageEntryId: entry.id,
      categoryId: entry.categoryId,
      categoryTitle: categoryTitleById(categories, entry.categoryId),
    });
  }

  return targets;
}

export async function resolveTicketPartnerBySlug(slug: string): Promise<ResolvedTicketPartner | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const [nominees, ambassadors, categories] = await Promise.all([
    listNominees(),
    listAmbassadorRegistrations(),
    listNomineeCategories(),
  ]);

  const nominee = nominees.find((item) => {
    if (item.ticketPartnerSlug.toLowerCase() === normalized) return true;
    return slugifyTicketPartner(item.name, item.id).toLowerCase() === normalized;
  });
  if (nominee) {
    return {
      slug: slugifyTicketPartner(nominee.name, nominee.id),
      sourceType: "nominee",
      sourceId: nominee.id,
      sourceName: nominee.name,
      category: categoryTitleById(categories, nominee.categoryId),
      email: nominee.contactEmail,
    };
  }

  const ambassador = ambassadors.find((item) => {
    if (item.ticketPartnerSlug.toLowerCase() === normalized) return true;
    return slugifyTicketPartner(item.fullName, item.id).toLowerCase() === normalized;
  });
  if (ambassador) {
    return {
      slug: slugifyTicketPartner(ambassador.fullName, ambassador.id),
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
  const { slugifyTicketPartner } = await import("@/lib/ticket-partner/links");
  const canonical = slugifyTicketPartner(nominee.name, nominee.id);
  const stored = nominee.ticketPartnerSlug.trim();
  if (stored && stored.toLowerCase() === canonical.toLowerCase()) return stored;
  return canonical;
}

export async function ensureAmbassadorTicketPartnerSlug(
  ambassador: { id: string; fullName: string; ticketPartnerSlug: string },
): Promise<string> {
  const { slugifyTicketPartner } = await import("@/lib/ticket-partner/links");
  const canonical = slugifyTicketPartner(ambassador.fullName, ambassador.id);
  const stored = ambassador.ticketPartnerSlug.trim();
  if (stored && stored.toLowerCase() === canonical.toLowerCase()) return stored;
  return canonical;
}
