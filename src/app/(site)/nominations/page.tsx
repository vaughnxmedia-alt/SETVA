import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { NominationsLiveVoting } from "@/components/nominations/NominationsLiveVoting";
import { NominationsPageShell } from "@/components/nominations/NominationsPageShell";
import { listPublishedNomineePageCategories } from "@/lib/nominee-workflows-store";
import { isPublicVotingOpen } from "@/lib/voting";

// Cached result is ~500KB once inline base64 is stripped from the DB. Dedupes
// the nominees query to at most once per minute per instance under traffic.
const getPublishedCategories = unstable_cache(
  () => listPublishedNomineePageCategories(),
  ["published-nominee-categories-v2"],
  { revalidate: 60, tags: ["nominee-page"] },
);

export const metadata: Metadata = {
  title: "Nominations",
  description: "Explore SETVA 2026 nominations by category — artists, albums, bands, and more.",
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function NominationsPage() {
  let categories: Awaited<ReturnType<typeof listPublishedNomineePageCategories>> = [];
  let loadError = false;

  try {
    categories = await getPublishedCategories();
  } catch {
    loadError = true;
  }

  return (
    <NominationsPageShell>
      <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-5">
        {loadError ? (
          <div className="mt-8 rounded-3xl border border-gold/25 bg-black/50 p-6 text-center text-white/70 shadow-2xl backdrop-blur-sm">
            <p className="font-display text-xl text-white">Nominations are loading slowly</p>
            <p className="mt-2 text-sm text-white/60">
              High traffic right now — please wait a moment and reload.
            </p>
          </div>
        ) : (
          <NominationsLiveVoting
            categories={categories}
            initialVotingOpen={isPublicVotingOpen()}
          />
        )}
      </div>
    </NominationsPageShell>
  );
}
