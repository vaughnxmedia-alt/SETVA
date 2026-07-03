"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import {
  HQBadge,
  HQButton,
  HQCard,
  HQCardHeader,
  HQEmptyState,
  HQSearchInput,
  hqInputClass,
  hqPanelClass,
} from "@/components/headquarters/ui";
import {
  nomineeConfirmationStatusOptions,
  type NomineeCategory,
  type NomineeMagazineArticle,
  type NomineePageEntry,
  type NomineeRecordFull,
  type NomineeVotingSetup,
} from "@/lib/nominees";
import type { PublishQueueItem } from "@/lib/nominee-workflows-store";
import { plainTextToMagazineHtml } from "@/lib/magazine-html";
import {
  blankMagazineArticleForm,
  MagazineArticleFields,
  type MagazineArticleFormState,
} from "@/components/headquarters/MagazineArticleFields";
import { NominationMediaImport } from "@/components/headquarters/NominationMediaImport";

type SimpleStatus = "Missing" | "Draft" | "Ready" | "Published";
type ModalMode = "nominee" | "graphic" | "article" | "voting" | "publish" | null;
type NomineeRow = NomineeRecordFull & { categoryTitle: string };
type NomineeFormState = ReturnType<typeof blankNominee>;
type ArticleFormState = Omit<MagazineArticleFormState, "nomineeId">;
type VotingFormState = {
  votingOpenDate: string;
  votingCloseDate: string;
  votingStatus: string;
};

type NomineesViewProps = {
  initialNominees?: NomineeRow[];
  initialCategories?: NomineeCategory[];
  initialNomineePageEntries?: NomineePageEntry[];
  initialMagazineArticles?: NomineeMagazineArticle[];
  initialVotingSetups?: NomineeVotingSetup[];
  initialPublishQueue?: PublishQueueItem[];
};

const blankNominee = (categoryId = "") => ({
  name: "",
  categoryId,
  cityRegion: "",
  contactEmail: "",
  contactPhone: "",
  socialLinks: "",
  internalNotes: "",
  confirmationStatus: "Pending",
});

const downloadLinkClass =
  "inline-flex rounded-lg border border-gold/20 px-3 py-1.5 text-sm font-medium text-cream/80 transition hover:border-gold/40 hover:text-gold";

export function NomineesView({
  initialNominees = [],
  initialCategories = [],
  initialNomineePageEntries = [],
  initialMagazineArticles = [],
  initialVotingSetups = [],
  initialPublishQueue = [],
}: NomineesViewProps = {}) {
  const [nominees, setNominees] = useState(initialNominees);
  const [categories, setCategories] = useState(initialCategories);
  const [pageEntries, setPageEntries] = useState(initialNomineePageEntries);
  const [articles, setArticles] = useState(initialMagazineArticles);
  const [votingSetups, setVotingSetups] = useState(initialVotingSetups);
  const [publishQueue, setPublishQueue] = useState(initialPublishQueue);
  const [loading, setLoading] = useState(initialNominees.length === 0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedNomineeIds, setExpandedNomineeIds] = useState<Set<string>>(() => new Set());
  const [activeNomineeId, setActiveNomineeId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [nomineeForm, setNomineeForm] = useState(blankNominee(initialCategories[0]?.id ?? ""));
  const [graphicUrl, setGraphicUrl] = useState("");
  const [graphicPreviewUrl, setGraphicPreviewUrl] = useState("");
  const [graphicFile, setGraphicFile] = useState<File | null>(null);
  const [articleForm, setArticleForm] = useState<Omit<MagazineArticleFormState, "nomineeId">>(() => {
    const { nomineeId: _, ...rest } = blankMagazineArticleForm();
    return rest;
  });
  const [votingForm, setVotingForm] = useState({
    votingOpenDate: "",
    votingCloseDate: "",
    votingStatus: "Draft",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const categoryTitle = useCallback(
    (categoryId: string) => categories.find((category) => category.id === categoryId)?.title ?? "Unassigned",
    [categories],
  );

  const filteredNominees = useMemo(() => {
    const q = search.toLowerCase();
    return nominees.filter((nominee) => {
      const matchSearch =
        !q ||
        [nominee.name, nominee.categoryTitle, nominee.cityRegion, nominee.contactEmail]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchCategory =
        categoryFilter === "all" || nominee.categoryId === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [nominees, search, categoryFilter]);

  const sortByNomineeCompletion = useCallback(
    (rows: NomineeRow[]): NomineeRow[] =>
      rows
        .map((nominee, index) => ({ nominee, index }))
        .sort((a, b) => {
          const rankGap = nomineeCompletionRank(a.nominee, pageEntries) -
            nomineeCompletionRank(b.nominee, pageEntries);
          if (rankGap !== 0) return rankGap;
          return a.index - b.index;
        })
        .map((entry) => entry.nominee),
    [pageEntries],
  );

  const nomineesByCategory = useMemo(() => {
    const assignedIds = new Set(activeCategories.map((category) => category.id));

    // Build category sections in their configured order, then float the most
    // complete categories (live/published nominees with graphics) to the top and
    // push unfinished categories (no graphics yet) to the bottom. A stable sort
    // preserves the configured order within each completion bucket.
    const categorySections = activeCategories
      .map((category) => {
        const rows = filteredNominees.filter((nominee) => nominee.categoryId === category.id);
        return { categoryId: category.id, rows: sortByNomineeCompletion(rows) };
      })
      .filter((section) => section.rows.length > 0)
      .map((section, index) => ({ ...section, index }))
      .sort((a, b) => {
        const rankGap =
          categoryCompletionRank(a.rows, pageEntries) - categoryCompletionRank(b.rows, pageEntries);
        if (rankGap !== 0) return rankGap;
        return a.index - b.index;
      });

    const sections: [string, NomineeRow[]][] = categorySections.map((section) => [
      section.categoryId,
      section.rows,
    ]);

    const unassigned = filteredNominees.filter((nominee) => !assignedIds.has(nominee.categoryId));
    if (unassigned.length) sections.push(["unassigned", sortByNomineeCompletion(unassigned)]);

    return sections;
  }, [activeCategories, filteredNominees, sortByNomineeCompletion, pageEntries]);

  const activeNominee = nominees.find((nominee) => nominee.id === activeNomineeId) ?? null;

  function toggleNomineeExpanded(id: string) {
    setExpandedNomineeIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const refresh = useCallback(async () => {
    const [directoryRes, workflowsRes] = await Promise.all([
      fetch("/api/headquarters/nominees"),
      fetch("/api/headquarters/nominees/workflows"),
    ]);
    if (directoryRes.status === 401 || workflowsRes.status === 401) {
      throw new Error("Session expired. Log in again.");
    }
    if (!directoryRes.ok || !workflowsRes.ok) {
      throw new Error("Could not load nominees.");
    }
    const directory = (await directoryRes.json()) as { nominees: NomineeRow[]; categories: NomineeCategory[] };
    const workflows = (await workflowsRes.json()) as {
      nomineePageEntries: NomineePageEntry[];
      magazineArticles: NomineeMagazineArticle[];
      votingSetups: NomineeVotingSetup[];
      publishQueue: PublishQueueItem[];
    };
    setNominees(directory.nominees);
    setCategories(directory.categories);
    setPageEntries(workflows.nomineePageEntries);
    setArticles(workflows.magazineArticles);
    setVotingSetups(workflows.votingSetups);
    setPublishQueue(workflows.publishQueue);
  }, []);

  useEffect(() => {
    if (initialNominees.length > 0) return;
    let active = true;
    refresh()
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load nominees.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialNominees.length, refresh]);

  function openNominee(nominee?: NomineeRow) {
    setActiveNomineeId(nominee?.id ?? null);
    setNomineeForm(
      nominee
        ? {
            name: nominee.name,
            categoryId: nominee.categoryId,
            cityRegion: nominee.cityRegion,
            contactEmail: nominee.contactEmail,
            contactPhone: nominee.contactPhone,
            socialLinks: nominee.socialLinks.join("\n"),
            internalNotes: nominee.internalNotes,
            confirmationStatus: nominee.confirmationStatus,
          }
        : blankNominee(activeCategories[0]?.id ?? ""),
    );
    setModal("nominee");
    setError(null);
  }

  function openGraphic(nominee: NomineeRow) {
    const entry = pageEntryFor(nominee.id, pageEntries);
    setActiveNomineeId(nominee.id);
    setGraphicUrl(entry?.nomineeGraphicUrl ?? "");
    setGraphicPreviewUrl(entry?.nomineeGraphicUrl ?? "");
    setGraphicFile(null);
    setModal("graphic");
    setError(null);
  }

  function openArticle(nominee: NomineeRow) {
    const article = articleFor(nominee.id, articles);
    setActiveNomineeId(nominee.id);
    setArticleForm({
      articleTitle: article?.articleTitle ?? `${nominee.name} Feature`,
      nomineeBio: plainTextToMagazineHtml(article?.nomineeBio ?? ""),
      articleBody: plainTextToMagazineHtml(article?.articleBody ?? ""),
      pullQuote: article?.pullQuote ?? "",
      articleImageUrl: article?.articleImageUrl ?? "",
      articleStatus: article?.articleStatus ?? "Draft",
    });
    setModal("article");
    setError(null);
  }

  function openVoting(nominee: NomineeRow) {
    const setup = votingFor(nominee.id, votingSetups);
    setActiveNomineeId(nominee.id);
    setVotingForm({
      votingOpenDate: setup?.votingOpenDate ?? "",
      votingCloseDate: setup?.votingCloseDate ?? "",
      votingStatus: setup?.votingStatus ?? "Draft",
    });
    setModal("voting");
    setError(null);
  }

  async function saveNominee() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(activeNomineeId ? `/api/headquarters/nominees/${activeNomineeId}` : "/api/headquarters/nominees", {
        method: activeNomineeId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nomineeForm),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage(activeNomineeId ? "Nominee updated." : "Nominee added.");
      setModal(null);
      await refresh();
    } catch {
      setError("Could not save nominee.");
    } finally {
      setBusy(false);
    }
  }

  async function persistGraphicUrl(): Promise<string> {
    if (!activeNominee) return graphicUrl;

    if (!graphicFile) {
      if (graphicUrl.startsWith("blob:")) {
        throw new Error("Choose an image file before saving. Browser preview URLs cannot be saved.");
      }
      return graphicUrl;
    }

    const formData = new FormData();
    formData.append("file", graphicFile);
    formData.append("nomineeId", activeNominee.id);
    formData.append("categoryId", activeNominee.categoryId);
    if (graphicUrl) formData.append("existingUrl", graphicUrl);

    const res = await fetch("/api/headquarters/nominees/graphics", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Could not save graphic file.");
    const data = (await res.json()) as { url?: string };
    if (!data.url) throw new Error("Could not save graphic file.");
    return data.url;
  }

  async function saveGraphic(publish = false) {
    if (!activeNominee) return;
    setBusy(true);
    setError(null);
    try {
      const existing = pageEntryFor(activeNominee.id, pageEntries);
      const savedGraphicUrl = await persistGraphicUrl();
      const wasPublished = Boolean(
        existing?.publishToNomineePage && existing.status === "Published",
      );

      await saveWorkflow("nomineePage", {
        id: existing?.id,
        payload: {
          nomineeId: activeNominee.id,
          categoryId: activeNominee.categoryId,
          nomineeGraphicMediaId: "",
          nomineeGraphicUrl: savedGraphicUrl,
          displayOrder: existing?.displayOrder ?? pageEntries.length,
          publishToNomineePage: publish ? true : wasPublished,
          status: publish
            ? "Published"
            : wasPublished
              ? "Published"
              : savedGraphicUrl
                ? "Ready"
                : "Draft",
        },
      });
      setGraphicUrl(savedGraphicUrl);
      setGraphicPreviewUrl(savedGraphicUrl);
      setGraphicFile(null);
      setMessage(
        publish
          ? "Published to nominee page."
          : wasPublished
            ? "Graphic updated on the live nominee page."
            : "Graphic saved internally.",
      );
      setModal(null);
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save graphic.");
    } finally {
      setBusy(false);
    }
  }

  async function saveArticle(publish = false) {
    if (!activeNominee) return;
    setBusy(true);
    setError(null);
    try {
      const existing = articleFor(activeNominee.id, articles);
      await saveWorkflow("magazineArticle", {
        id: existing?.id,
        payload: {
          nomineeId: activeNominee.id,
          ...articleForm,
          publishToMagazine: publish,
          articleStatus: publish ? "Published" : articleForm.articleStatus,
          publishDate: publish ? new Date().toISOString() : existing?.publishDate ?? "",
          slug: existing?.slug ?? slugify(`${activeNominee.name}-${articleForm.articleTitle}`),
        },
      });
      setMessage(publish ? "Published to Visionary Magazine." : "Article saved to Supabase.");
      setModal(null);
      await refresh();
    } catch {
      setError("Could not save article.");
    } finally {
      setBusy(false);
    }
  }

  async function saveVoting() {
    if (!activeNominee) return;
    setBusy(true);
    setError(null);
    try {
      const existing = votingFor(activeNominee.id, votingSetups);
      const nomineeIds = existing?.nomineeIds.includes(activeNominee.id)
        ? existing.nomineeIds
        : [...(existing?.nomineeIds ?? []), activeNominee.id];
      await saveWorkflow("votingSetup", {
        id: existing?.id,
        payload: {
          categoryId: activeNominee.categoryId,
          nomineeIds,
          votingOpenDate: votingForm.votingOpenDate,
          votingCloseDate: votingForm.votingCloseDate,
          votingStatus: votingForm.votingStatus,
        },
      });
      setMessage("Voting saved.");
      setModal(null);
      await refresh();
    } catch {
      setError("Could not save voting.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <HQShell title="Nominees">
      <p className="mb-5 text-sm text-cream/50">
        Add nominees, upload graphics, write articles, and publish to the live site when you are ready.
      </p>

      {message ? <Notice tone="success">{message}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}

      <NominationMediaImport onComplete={refresh} />

      {loading ? (
        <p className="text-sm text-cream/50">Loading nominees…</p>
      ) : null}

      {!loading ? (
      <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <HQSearchInput value={search} onChange={setSearch} placeholder="Search nominees..." />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className={`${hqInputClass} lg:min-w-[220px]`}
        >
          <option value="all">All categories</option>
          {activeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
        <HQButton onClick={() => openNominee()} disabled={activeCategories.length === 0}>
          Add Nominee
        </HQButton>
      </div>

      {filteredNominees.length === 0 ? (
        <HQEmptyState title="No nominees yet" description="Add your first nominee to start the content checklist." />
      ) : (
        <div className="space-y-8">
          {nomineesByCategory.map(([categoryId, rows]) => (
            <section key={categoryId}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/70">
                    Category
                  </p>
                  <h2 className="font-display text-2xl text-cream">
                    {categoryId === "unassigned"
                      ? "Unassigned"
                      : categoryTitle(categoryId)}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {categoryVideoUrl(categoryId, categories) ? (
                    <a
                      href={categoryVideoUrl(categoryId, categories)}
                      download={downloadFileName(categoryTitle(categoryId), "video")}
                      className={downloadLinkClass}
                    >
                      Download video
                    </a>
                  ) : null}
                  <p className="text-sm text-cream/45">
                    {rows.length} nominee{rows.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {rows.map((nominee) => {
                  const status = hubStatus(nominee, pageEntries, articles, votingSetups);
                  const expanded = expandedNomineeIds.has(nominee.id);
                  const pageEntry = pageEntryFor(nominee.id, pageEntries);
                  const graphicUrl = pageEntry?.nomineeGraphicUrl ?? "";
                  return (
                    <HQCard key={nominee.id} className="p-5">
                      <button
                        type="button"
                        onClick={() => toggleNomineeExpanded(nominee.id)}
                        aria-expanded={expanded}
                        className="flex w-full items-start justify-between gap-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-xl text-cream">{nominee.name}</p>
                          <p className="mt-1 text-sm text-cream/50">{categoryTitle(nominee.categoryId)}</p>
                          {nominee.cityRegion ? (
                            <p className="mt-1 text-xs text-cream/40">{nominee.cityRegion}</p>
                          ) : null}
                        </div>
                        <span
                          aria-hidden
                          className={`mt-1 shrink-0 text-sm text-gold transition-transform ${
                            expanded ? "rotate-180" : ""
                          }`}
                        >
                          ▼
                        </span>
                      </button>

                      <div className="mt-3 flex flex-col items-center">
                        {graphicUrl ? (
                          <div className="relative aspect-square w-full max-w-[16rem] overflow-hidden rounded-lg border border-gold/20 bg-black/40">
                            <Image
                              src={graphicUrl}
                              alt={`${nominee.name} graphic`}
                              fill
                              className="object-contain"
                              sizes="256px"
                            />
                          </div>
                        ) : (
                          <div className="flex aspect-square w-full max-w-[16rem] items-center justify-center rounded-lg border border-dashed border-gold/20 bg-black/20 px-2 text-center text-xs text-cream/40">
                            No graphic yet
                          </div>
                        )}
                        <HQButton
                          variant="outline"
                          className="mt-2 px-2.5 py-1 text-xs"
                          onClick={(event) => {
                            event.stopPropagation();
                            openGraphic(nominee);
                          }}
                        >
                          {graphicUrl ? "Change graphic" : "Add graphic"}
                        </HQButton>
                        {graphicUrl ? (
                          <a
                            href={graphicUrl}
                            download={downloadFileName(nominee.name, "graphic")}
                            className="mt-2 text-xs font-medium text-gold hover:text-gold/80"
                            onClick={(event) => event.stopPropagation()}
                          >
                            Download graphic
                          </a>
                        ) : null}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                        <Status label="Graphic" value={status.graphic} />
                        <Status label="Article" value={status.article} />
                        <Status label="Voting" value={status.voting} />
                        <Status label="Nominee Page" value={status.page} />
                      </div>

                      {expanded ? (
                        <>
                          <div className="mt-5 grid gap-2 text-sm text-cream/70 sm:grid-cols-2">
                            <Checklist done label="Nominee Added" />
                            <Checklist done={status.graphic !== "Missing"} label="Graphic Uploaded" />
                            <Checklist done={status.page === "Published"} label="Published to Nominee Page" />
                            <Checklist optional done={status.article === "Published"} label="Magazine Article" />
                            <Checklist optional done={status.voting === "Published" || status.voting === "Ready"} label="Added to Voting" />
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            <HQButton variant="outline" onClick={() => openNominee(nominee)}>Edit Nominee</HQButton>
                            <HQButton variant="outline" onClick={() => openArticle(nominee)}>Write Article</HQButton>
                            <HQButton variant="outline" onClick={() => openVoting(nominee)}>Add to Voting</HQButton>
                            <HQButton onClick={() => { setActiveNomineeId(nominee.id); setModal("publish"); }}>Publish</HQButton>
                          </div>
                        </>
                      ) : null}
                    </HQCard>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {publishQueue.length ? (
        <div className="mt-6 text-xs text-cream/35">
          {publishQueue.length} checklist item{publishQueue.length === 1 ? "" : "s"} need attention.
        </div>
      ) : null}
      </>
      ) : null}

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`${hqPanelClass} max-h-[90vh] w-full max-w-2xl overflow-y-auto`}>
            <HQCardHeader
              title={modalTitle(modal)}
              subtitle={activeNominee?.name}
              action={<HQButton variant="ghost" onClick={() => setModal(null)} disabled={busy}>Close</HQButton>}
            />
            <div className="space-y-4 p-5">
              {modal === "nominee" ? (
                <NomineeFields
                  form={nomineeForm}
                  setForm={setNomineeForm}
                  categories={activeCategories}
                />
              ) : null}

              {modal === "graphic" ? (
                <GraphicFields
                  previewUrl={graphicPreviewUrl}
                  setPreviewUrl={setGraphicPreviewUrl}
                  onFileSelected={setGraphicFile}
                />
              ) : null}

              {modal === "article" ? (
                <>
                  <p className="mb-4 text-sm text-cream/55">
                    Articles are saved to Supabase. Publishing makes them live on Visionary Magazine with the same formatting shown in the editor.
                  </p>
                  <MagazineArticleFields
                    form={{ ...articleForm, nomineeId: activeNominee?.id ?? "" }}
                    setForm={(fn) => {
                      setArticleForm((current) => {
                        const merged = { ...current, nomineeId: activeNominee?.id ?? "" };
                        const next = typeof fn === "function" ? fn(merged) : fn;
                        const { nomineeId: _, ...rest } = next;
                        return rest;
                      });
                    }}
                  />
                </>
              ) : null}

              {modal === "voting" ? (
                <VotingFields form={votingForm} setForm={setVotingForm} />
              ) : null}

              {modal === "publish" ? (
                <p className="text-sm text-cream/70">
                  This publishes the nominee graphic to the public nominations page. Saving a graphic alone does not publish it.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-gold/10 px-5 py-4">
              <HQButton variant="outline" onClick={() => setModal(null)} disabled={busy}>Cancel</HQButton>
              {modal === "nominee" ? <HQButton onClick={saveNominee} disabled={busy || !nomineeForm.name || !nomineeForm.categoryId}>Save Nominee</HQButton> : null}
              {modal === "graphic" ? <HQButton onClick={() => saveGraphic(false)} disabled={busy}>Save Graphic</HQButton> : null}
              {modal === "article" ? (
                <>
                  <HQButton variant="outline" onClick={() => saveArticle(false)} disabled={busy || !articleForm.articleTitle}>Save Draft</HQButton>
                  <HQButton onClick={() => saveArticle(true)} disabled={busy || !articleForm.articleTitle}>Publish to Visionary Magazine</HQButton>
                </>
              ) : null}
              {modal === "voting" ? <HQButton onClick={saveVoting} disabled={busy}>Add to Voting</HQButton> : null}
              {modal === "publish" ? <HQButton onClick={() => saveGraphic(true)} disabled={busy || !pageEntryFor(activeNomineeId ?? "", pageEntries)?.nomineeGraphicUrl}>Publish to Nominee Page</HQButton> : null}
            </div>
          </div>
        </div>
      ) : null}
    </HQShell>
  );

}

function Status({ label, value }: { label: string; value: SimpleStatus }) {
  return (
    <div className="rounded-lg border border-gold/15 bg-black/20 p-2">
      <p className="mb-1 text-[10px] uppercase tracking-wider text-cream/35">{label}</p>
      <HQBadge tone={statusTone(value)}>{value}</HQBadge>
    </div>
  );
}

function Checklist({ done, label, optional = false }: { done: boolean; label: string; optional?: boolean }) {
  return (
    <p className={done ? "text-emerald-light" : "text-cream/45"}>
      {done ? "✓" : "○"} {label}{optional ? " (Optional)" : ""}
    </p>
  );
}

function Notice({ children, tone }: { children: string; tone: "success" | "error" }) {
  const classes = tone === "success"
    ? "border-emerald/30 bg-emerald/10 text-emerald-light"
    : "border-red-500/30 bg-red-950/40 text-red-200";
  return <p className={`mb-4 rounded-lg border px-4 py-2 text-sm ${classes}`}>{children}</p>;
}

function NomineeFields({
  form,
  setForm,
  categories,
}: {
  form: ReturnType<typeof blankNominee>;
  setForm: (fn: NomineeFormState | ((form: NomineeFormState) => NomineeFormState)) => void;
  categories: NomineeCategory[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nominee name" value={form.name} onChange={(value) => setForm((f) => ({ ...f, name: value }))} required />
      <label className="block">
        <span className="mb-1 block text-xs text-cream/50">Category</span>
        <select value={form.categoryId} onChange={(event) => setForm((f) => ({ ...f, categoryId: event.target.value }))} className={`${hqInputClass} w-full`}>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
        </select>
      </label>
      <Field label="City / region" value={form.cityRegion} onChange={(value) => setForm((f) => ({ ...f, cityRegion: value }))} />
      <Field label="Contact email" value={form.contactEmail} onChange={(value) => setForm((f) => ({ ...f, contactEmail: value }))} />
      <Field label="Contact phone" value={form.contactPhone} onChange={(value) => setForm((f) => ({ ...f, contactPhone: value }))} />
      <label className="block">
        <span className="mb-1 block text-xs text-cream/50">Confirmation status</span>
        <select value={form.confirmationStatus} onChange={(event) => setForm((f) => ({ ...f, confirmationStatus: event.target.value }))} className={`${hqInputClass} w-full`}>
          {nomineeConfirmationStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <TextArea label="Social media links" value={form.socialLinks} onChange={(value) => setForm((f) => ({ ...f, socialLinks: value }))} />
      <TextArea label="Internal notes" value={form.internalNotes} onChange={(value) => setForm((f) => ({ ...f, internalNotes: value }))} />
    </div>
  );
}

function GraphicFields({
  previewUrl,
  setPreviewUrl,
  onFileSelected,
}: {
  previewUrl: string;
  setPreviewUrl: (value: string) => void;
  onFileSelected: (file: File | null) => void;
}) {
  return (
    <>
      <p className="text-sm text-cream/55">
        Upload an image file. Save stores the graphic internally and replaces the previous file. Use Publish on the nominee card to make it live.
      </p>
      <label className="block">
        <span className="mb-1 block text-xs text-cream/50">Upload graphic</span>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            onFileSelected(file);
            if (file) {
              setPreviewUrl(URL.createObjectURL(file));
            }
          }}
          className={`${hqInputClass} w-full`}
        />
      </label>
      {previewUrl ? (
        <img src={previewUrl} alt="Nominee graphic preview" className="max-h-64 rounded-xl border border-gold/20 object-contain" />
      ) : null}
    </>
  );
}

function VotingFields({
  form,
  setForm,
}: {
  form: VotingFormState;
  setForm: (fn: VotingFormState | ((form: VotingFormState) => VotingFormState)) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Voting open date" type="datetime-local" value={form.votingOpenDate} onChange={(value) => setForm((f) => ({ ...f, votingOpenDate: value }))} />
      <Field label="Voting close date" type="datetime-local" value={form.votingCloseDate} onChange={(value) => setForm((f) => ({ ...f, votingCloseDate: value }))} />
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs text-cream/50">Status</span>
        <select value={form.votingStatus} onChange={(event) => setForm((f) => ({ ...f, votingStatus: event.target.value }))} className={`${hqInputClass} w-full`}>
          <option value="Draft">Draft</option>
          <option value="Ready">Ready</option>
          <option value="Published">Published</option>
        </select>
      </label>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-cream/50">{label}{required ? " *" : ""}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={`${hqInputClass} w-full`} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block sm:col-span-2">
      <span className="mb-1 block text-xs text-cream/50">{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className={`${hqInputClass} w-full`} />
    </label>
  );
}

function hubStatus(
  nominee: NomineeRow,
  pageEntries: NomineePageEntry[],
  articles: NomineeMagazineArticle[],
  votingSetups: NomineeVotingSetup[],
): { graphic: SimpleStatus; article: SimpleStatus; voting: SimpleStatus; page: SimpleStatus } {
  const pageEntry = pageEntryFor(nominee.id, pageEntries);
  const article = articleFor(nominee.id, articles);
  const voting = votingFor(nominee.id, votingSetups);
  const hasGraphic = Boolean(pageEntry?.nomineeGraphicUrl || pageEntry?.nomineeGraphicMediaId);

  return {
    graphic: hasGraphic ? pageEntry?.status ?? "Ready" : "Missing",
    article: article?.articleStatus ?? "Missing",
    voting: voting?.votingStatus ?? "Missing",
    page: pageEntry?.publishToNomineePage ? pageEntry.status : hasGraphic ? pageEntry?.status ?? "Ready" : "Missing",
  };
}

function pageEntryFor(nomineeId: string, entries: NomineePageEntry[]): NomineePageEntry | undefined {
  return entries.find((entry) => entry.nomineeId === nomineeId);
}

/**
 * Lower rank sorts higher. Live nominees with a published graphic come first,
 * then nominees that have a graphic (ready but not published), then the rest.
 */
function nomineeCompletionRank(nominee: NomineeRow, entries: NomineePageEntry[]): number {
  const pageEntry = pageEntryFor(nominee.id, entries);
  const hasGraphic = Boolean(pageEntry?.nomineeGraphicUrl || pageEntry?.nomineeGraphicMediaId);
  const isLive = Boolean(pageEntry?.publishToNomineePage && pageEntry.status === "Published");

  if (isLive && hasGraphic) return 0;
  if (hasGraphic) return 1;
  return 2;
}

/**
 * Ranks a whole category by its most complete nominee, so categories with live
 * published nominees sort above categories that only have graphics, which in turn
 * sort above categories with nothing uploaded yet.
 */
function categoryCompletionRank(rows: NomineeRow[], entries: NomineePageEntry[]): number {
  return rows.reduce(
    (best, nominee) => Math.min(best, nomineeCompletionRank(nominee, entries)),
    Number.POSITIVE_INFINITY,
  );
}

function articleFor(nomineeId: string, articles: NomineeMagazineArticle[]): NomineeMagazineArticle | undefined {
  return articles.find((article) => article.nomineeId === nomineeId);
}

function votingFor(nomineeId: string, setups: NomineeVotingSetup[]): NomineeVotingSetup | undefined {
  return setups.find((setup) => setup.nomineeIds.includes(nomineeId));
}

function categoryVideoUrl(categoryId: string, categories: NomineeCategory[]): string {
  return categories.find((category) => category.id === categoryId)?.videoUrl ?? "";
}

function downloadFileName(name: string, fallback: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return slug || fallback;
}

function statusTone(status: SimpleStatus): "default" | "gold" | "green" | "amber" | "red" {
  if (status === "Published") return "green";
  if (status === "Ready") return "gold";
  if (status === "Draft") return "amber";
  return "red";
}

function modalTitle(modal: Exclude<ModalMode, null>): string {
  if (modal === "nominee") return "Edit Nominee";
  if (modal === "graphic") return "Upload Graphic";
  if (modal === "article") return "Visionary Magazine Article";
  if (modal === "voting") return "Add to Voting";
  return "Publish";
}

async function saveWorkflow(
  kind: "nomineePage" | "magazineArticle" | "votingSetup",
  body: { id?: string; payload: Record<string, unknown> },
) {
  const res = await fetch("/api/headquarters/nominees/workflows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, ...body }),
  });
  if (!res.ok) throw new Error("Workflow save failed");
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
