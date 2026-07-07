import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { NominationsLiveVoting } from "@/components/nominations/NominationsLiveVoting";
import { NominationsPageShell } from "@/components/nominations/NominationsPageShell";
import { listPublishedNomineePageCategories } from "@/lib/nominee-workflows-store";
import { isPublicVotingOpen } from "@/lib/voting";

// Dedupe the heavy (~14MB) published-nominees query so it runs at most once per
// minute across all visitors, instead of once per request. Works in dev and
// production; call revalidateTag("nominee-page") after Headquarters edits to
// refresh sooner.
const getPublishedCategories = unstable_cache(
  () => listPublishedNomineePageCategories(),
  ["published-nominee-categories"],
  { revalidate: 60, tags: ["nominee-page"] },
);

export const metadata: Metadata = {
  title: "Nominations",
  description: "Explore SETVA 2026 nominations by category — artists, albums, bands, and more.",
};

// Cache the (heavy) published-nominees query and regenerate at most once per
// minute, serving stale instantly while revalidating in the background. This
// keeps Headquarters edits appearing within ~60s without re-running ~14MB of
// Supabase queries on every visitor (which overwhelms the database).
export const revalidate = 60;

export default async function NominationsPage() {
  const categories = await getPublishedCategories();

  return (
    <NominationsPageShell>
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-5">
        <NominationsLiveVoting
          categories={categories}
          initialVotingOpen={isPublicVotingOpen()}
        />
      </div>
    </NominationsPageShell>
  );
}
