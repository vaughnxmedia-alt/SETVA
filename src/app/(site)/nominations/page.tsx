import type { Metadata } from "next";
import { NominationsBrowse } from "@/components/nominations/NominationsBrowse";
import { NominationsHeroIntro } from "@/components/nominations/NominationsHeroIntro";
import { NominationsPageShell } from "@/components/nominations/NominationsPageShell";
import { listPublishedNomineePageCategories } from "@/lib/nominee-workflows-store";
import { isPublicVotingOpen } from "@/lib/voting";

export const metadata: Metadata = {
  title: "Nominations",
  description: "Explore SETVA 2026 nominations by category — artists, albums, bands, and more.",
};

// Always render fresh so Headquarters edits to published nominees, graphics,
// videos, and categories appear on the live site immediately.
export const dynamic = "force-dynamic";

export default async function NominationsPage() {
  const categories = await listPublishedNomineePageCategories();
  const votingOpen = isPublicVotingOpen();

  return (
    <NominationsPageShell>
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-3 sm:px-6 sm:pb-16 sm:pt-5">
        <NominationsHeroIntro />

        {categories.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-gold/25 bg-black/50 p-6 text-center text-white/70 shadow-2xl backdrop-blur-sm">
            Nominees will appear here when SETVA publishes them.
          </div>
        ) : (
          <NominationsBrowse categories={categories} votingOpen={votingOpen} />
        )}
      </div>
    </NominationsPageShell>
  );
}
