"use client";

import { useState } from "react";
import { MagazineArticleCard } from "@/components/magazine/MagazineArticleCard";
import { HonoreeCard } from "@/components/magazine/HonoreeCard";
import type { MagazineArticle } from "@/lib/magazine";
import type { PublicHonoree } from "@/lib/honorees";

type Tab = "articles" | "honorees";

export function MagazineContent({
  articles,
  honorees,
}: {
  articles: MagazineArticle[];
  honorees: PublicHonoree[];
}) {
  const [tab, setTab] = useState<Tab>("articles");
  const showHonorees = honorees.length > 0;

  return (
    <div className="mt-8 sm:mt-10">
      {showHonorees ? (
        <div className="mx-auto mb-8 flex max-w-md items-center justify-center gap-2 rounded-full border border-gold/20 bg-black/40 p-1">
          <TabButton active={tab === "articles"} onClick={() => setTab("articles")}>
            Articles
          </TabButton>
          <TabButton active={tab === "honorees"} onClick={() => setTab("honorees")}>
            Honorees
          </TabButton>
        </div>
      ) : null}

      {tab === "articles" || !showHonorees ? (
        <div className="mx-auto max-w-3xl space-y-6">
          {articles.length === 0 ? (
            <EmptyPanel>Magazine features will appear here when SETVA publishes them.</EmptyPanel>
          ) : (
            articles.map((article) => (
              <MagazineArticleCard key={article.slug} article={article} />
            ))
          )}
        </div>
      ) : (
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {honorees.length === 0 ? (
            <EmptyPanel>Honorees will appear here when SETVA publishes them.</EmptyPanel>
          ) : (
            honorees.map((honoree) => <HonoreeCard key={honoree.slug} honoree={honoree} />)
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition ${
        active ? "bg-gold/20 text-gold" : "text-white/70 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full rounded-3xl border border-gold/25 bg-black/50 p-6 text-center text-white/70 shadow-2xl backdrop-blur-sm">
      {children}
    </div>
  );
}
