"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  blankMagazineArticleForm,
  MagazineArticleFields,
  type MagazineArticleFormState,
} from "@/components/headquarters/MagazineArticleFields";
import { HQShell } from "@/components/headquarters/HQShell";
import {
  HQBadge,
  HQButton,
  HQCard,
  HQCardHeader,
  HQEmptyState,
  HQSearchInput,
  hqPanelClass,
} from "@/components/headquarters/ui";
import type { NomineeMagazineArticle } from "@/lib/nominees";

type HonoreeOption = { id: string; name: string; awardTitle?: string };
type EditorMode = "none" | "new" | "edit";

export function MagazineArticlesView() {
  const [articles, setArticles] = useState<NomineeMagazineArticle[]>([]);
  const [honorees, setHonorees] = useState<HonoreeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>("none");
  const [form, setForm] = useState<MagazineArticleFormState>(blankMagazineArticleForm);
  const [existingSlug, setExistingSlug] = useState("");
  const [isPublishedLive, setIsPublishedLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const honoreeNameById = useMemo(
    () => new Map(honorees.map((honoree) => [honoree.id, honoree.name])),
    [honorees],
  );

  const filteredArticles = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return articles;
    return articles.filter((article) => {
      const honoreeName = honoreeNameById.get(article.nomineeId) ?? "";
      return [article.articleTitle, article.slug, honoreeName].join(" ").toLowerCase().includes(q);
    });
  }, [articles, search, honoreeNameById]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/headquarters/magazine");
    if (!res.ok) throw new Error("Could not load magazine articles.");
    const data = (await res.json()) as {
      articles: NomineeMagazineArticle[];
      honorees: HonoreeOption[];
    };
    setArticles(data.articles ?? []);
    setHonorees(data.honorees ?? []);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setError("Could not load Visionary Magazine articles."))
      .finally(() => setLoading(false));
  }, [refresh]);

  function openNewArticle() {
    setSelectedId(null);
    setEditorMode("new");
    setForm(blankMagazineArticleForm());
    setExistingSlug("");
    setIsPublishedLive(false);
    setMessage(null);
    setError(null);
  }

  function openArticle(article: NomineeMagazineArticle) {
    setSelectedId(article.id);
    setEditorMode("edit");
    setForm({
      articleTitle: article.articleTitle,
      nomineeBio: article.nomineeBio,
      articleBody: article.articleBody,
      pullQuote: article.pullQuote,
      articleImageUrl: article.articleImageUrl,
      articleStatus: article.articleStatus,
      nomineeId: article.nomineeId,
    });
    setExistingSlug(article.slug);
    setIsPublishedLive(article.publishToMagazine && article.articleStatus === "Published");
    setMessage(null);
    setError(null);
  }

  async function saveArticle(publish = false) {
    if (!form.articleTitle.trim()) {
      setError("Article title is required.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const existing = selectedId ? articles.find((article) => article.id === selectedId) : undefined;
      const slug =
        existing?.slug ??
        slugify(form.articleTitle || "visionary-magazine-article");

      const res = await fetch("/api/headquarters/magazine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedId ?? undefined,
          ...form,
          slug,
          publishToMagazine: publish,
          articleStatus: publish ? "Published" : form.articleStatus,
          publishDate: publish ? new Date().toISOString() : existing?.publishDate ?? "",
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }

      const data = (await res.json()) as { record: NomineeMagazineArticle };
      setMessage(
        publish ? "Published to Visionary Magazine." : "Article saved to Supabase.",
      );
      setSelectedId(data.record.id);
      setEditorMode("edit");
      setExistingSlug(data.record.slug);
      setIsPublishedLive(
        data.record.publishToMagazine && data.record.articleStatus === "Published",
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save article.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteArticle() {
    if (!selectedId) return;
    if (!window.confirm("Delete this article? This cannot be undone.")) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/headquarters/magazine?id=${encodeURIComponent(selectedId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setMessage("Article deleted.");
      setSelectedId(null);
      setEditorMode("none");
      setForm(blankMagazineArticleForm());
      await refresh();
    } catch {
      setError("Could not delete article.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <HQShell title="Visionary Magazine Editing">
      <p className="mb-6 text-sm text-cream/50">
        Create and edit Visionary Magazine articles. Published articles appear on the public magazine.
      </p>

      {message ? (
        <p className="mb-4 rounded-lg border border-emerald/30 bg-emerald/10 px-4 py-2 text-sm text-emerald-light">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <HQSearchInput value={search} onChange={setSearch} placeholder="Search articles…" />
        </div>
        <HQButton onClick={openNewArticle}>Add article</HQButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <HQCard className="h-fit">
          <HQCardHeader
            title="Articles"
            subtitle={
              loading
                ? "Loading…"
                : `${articles.length} article${articles.length === 1 ? "" : "s"}`
            }
          />
          <div className="max-h-[70vh] overflow-y-auto p-3">
            {loading ? (
              <p className="px-2 py-6 text-sm text-cream/40">Loading articles…</p>
            ) : filteredArticles.length === 0 ? (
              <HQEmptyState
                title="No articles yet"
                description="Add an article or write one from the Nominees workflow."
              />
            ) : (
              <ul className="space-y-2">
                {filteredArticles.map((article) => {
                  const selected = selectedId === article.id;
                  const live = article.publishToMagazine && article.articleStatus === "Published";
                  return (
                    <li key={article.id}>
                      <button
                        type="button"
                        onClick={() => openArticle(article)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                          selected
                            ? "border-gold/50 bg-gold/10"
                            : "border-gold/15 bg-black/20 hover:border-gold/35"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-cream">{article.articleTitle}</p>
                          <ArticleStatusBadge
                            live={live}
                            status={article.articleStatus}
                          />
                        </div>
                        {article.nomineeId ? (
                          <p className="mt-1 text-xs text-cream/45">
                            {honoreeNameById.get(article.nomineeId) ?? "Linked honoree"}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-cream/35">No honoree linked</p>
                        )}
                        <p className="mt-1 text-[11px] text-cream/30">
                          Updated {formatDate(article.updatedAt)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </HQCard>

        <div className={hqPanelClass}>
          {editorMode === "none" ? (
            <div className="p-8">
              <HQEmptyState
                title="Select or add an article"
                description="Choose an article from the list to edit it, or click Add article to create a new feature."
              />
            </div>
          ) : (
            <>
              <HQCardHeader
                title={editorMode === "new" ? "New article" : "Edit article"}
                subtitle={
                  isPublishedLive && existingSlug
                    ? "Live on Visionary Magazine"
                    : "Draft — not visible on the public site until published"
                }
                action={
                  isPublishedLive && existingSlug ? (
                    <Link
                      href={`/magazine/${existingSlug}`}
                      target="_blank"
                      className="text-xs text-gold hover:underline"
                    >
                      View live →
                    </Link>
                  ) : null
                }
              />
              <div className="space-y-6 p-5">
                <MagazineArticleFields
                  form={form}
                  setForm={setForm}
                  honorees={honorees}
                  showHonoreeLink
                />
                <div className="flex flex-wrap gap-2 border-t border-gold/10 pt-4">
                  <HQButton disabled={busy} onClick={() => saveArticle(false)}>
                    Save draft
                  </HQButton>
                  <HQButton disabled={busy} variant="primary" onClick={() => saveArticle(true)}>
                    Publish to Visionary Magazine
                  </HQButton>
                  {editorMode === "edit" && selectedId ? (
                    <HQButton disabled={busy} variant="outline" onClick={deleteArticle}>
                      Delete
                    </HQButton>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </HQShell>
  );
}

function ArticleStatusBadge({
  live,
  status,
}: {
  live: boolean;
  status: string;
}) {
  if (live) return <HQBadge tone="green">Published</HQBadge>;
  if (status === "Ready") return <HQBadge tone="gold">Ready</HQBadge>;
  return <HQBadge tone="amber">Draft</HQBadge>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
