"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
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
import type { Honoree } from "@/lib/honorees";
import { slugifyHonoree } from "@/lib/honorees";

const RichTextEditor = dynamic(
  () => import("@/components/headquarters/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-gold/20 bg-black/40 px-3 py-8 text-sm text-cream/40">
        Loading editor…
      </div>
    ),
  },
);

type EditorMode = "none" | "new" | "edit";

type HonoreeFormState = {
  name: string;
  awardTitle: string;
  graphicUrl: string;
  accomplishments: string;
  pullQuote: string;
  displayOrder: number;
};

function blankForm(): HonoreeFormState {
  return {
    name: "",
    awardTitle: "",
    graphicUrl: "",
    accomplishments: "",
    pullQuote: "",
    displayOrder: 0,
  };
}

export function HonoreesView() {
  const [honorees, setHonorees] = useState<Honoree[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>("none");
  const [form, setForm] = useState<HonoreeFormState>(blankForm);
  const [existingSlug, setExistingSlug] = useState("");
  const [isPublishedLive, setIsPublishedLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return honorees;
    return honorees.filter((h) =>
      [h.name, h.awardTitle, h.slug].join(" ").toLowerCase().includes(q),
    );
  }, [honorees, search]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/headquarters/honorees");
    if (!res.ok) throw new Error("Could not load honorees.");
    const data = (await res.json()) as { honorees: Honoree[] };
    setHonorees(data.honorees ?? []);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setError("Could not load honorees."))
      .finally(() => setLoading(false));
  }, [refresh]);

  function openNew() {
    setSelectedId(null);
    setEditorMode("new");
    setForm(blankForm());
    setExistingSlug("");
    setIsPublishedLive(false);
    setMessage(null);
    setError(null);
  }

  function openHonoree(honoree: Honoree) {
    setSelectedId(honoree.id);
    setEditorMode("edit");
    setForm({
      name: honoree.name,
      awardTitle: honoree.awardTitle,
      graphicUrl: honoree.graphicUrl,
      accomplishments: honoree.accomplishments,
      pullQuote: honoree.pullQuote,
      displayOrder: honoree.displayOrder,
    });
    setExistingSlug(honoree.slug);
    setIsPublishedLive(honoree.publishToMagazine && honoree.status === "Published");
    setMessage(null);
    setError(null);
  }

  const currentSlug = useMemo(() => {
    if (existingSlug) return existingSlug;
    return slugifyHonoree(`${form.name}-${form.awardTitle}`) || slugifyHonoree(form.name);
  }, [existingSlug, form.name, form.awardTitle]);

  async function uploadGraphic(file: File) {
    if (!form.name.trim()) {
      setError("Enter the honoree name before uploading a graphic.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("slug", currentSlug);
      const res = await fetch("/api/headquarters/honorees/graphic", { method: "POST", body });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Upload failed");
      }
      const data = (await res.json()) as { url: string };
      setForm((f) => ({ ...f, graphicUrl: data.url }));
      setMessage("Graphic uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload graphic.");
    } finally {
      setUploading(false);
    }
  }

  async function save(publish = false) {
    if (!form.name.trim() || !form.awardTitle.trim()) {
      setError("Name and award title are required.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const existing = selectedId ? honorees.find((h) => h.id === selectedId) : undefined;
      const res = await fetch("/api/headquarters/honorees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedId ?? undefined,
          ...form,
          slug: existing?.slug ?? currentSlug,
          publishToMagazine: publish ? true : existing?.publishToMagazine ?? false,
          status: publish ? "Published" : existing?.status ?? "Draft",
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }

      const data = (await res.json()) as { record: Honoree };
      setMessage(publish ? "Published to Visionary Magazine." : "Honoree saved.");
      setSelectedId(data.record.id);
      setEditorMode("edit");
      setExistingSlug(data.record.slug);
      setIsPublishedLive(data.record.publishToMagazine && data.record.status === "Published");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save honoree.");
    } finally {
      setBusy(false);
    }
  }

  async function unpublish() {
    if (!selectedId) return;
    const existing = honorees.find((h) => h.id === selectedId);
    if (!existing) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/headquarters/honorees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedId,
          ...form,
          slug: existing.slug,
          publishToMagazine: false,
          status: "Ready",
        }),
      });
      if (!res.ok) throw new Error("Could not unpublish");
      setMessage("Removed from the public magazine.");
      setIsPublishedLive(false);
      await refresh();
    } catch {
      setError("Could not unpublish honoree.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!selectedId) return;
    if (!window.confirm("Delete this honoree? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/headquarters/honorees?id=${encodeURIComponent(selectedId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setMessage("Honoree deleted.");
      setSelectedId(null);
      setEditorMode("none");
      setForm(blankForm());
      await refresh();
    } catch {
      setError("Could not delete honoree.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <HQShell title="Honorees">
      <p className="mb-6 text-sm text-cream/50">
        Award winners celebrated in Visionary Magazine (Visionary of the Year, Legacy Award, and
        more). Write up their accomplishments, then publish to put them on the public magazine.
        Nothing appears on the site until you press Publish.
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
          <HQSearchInput value={search} onChange={setSearch} placeholder="Search honorees…" />
        </div>
        <HQButton onClick={openNew}>Add honoree</HQButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <HQCard className="h-fit">
          <HQCardHeader
            title="Honorees"
            subtitle={
              loading ? "Loading…" : `${honorees.length} honoree${honorees.length === 1 ? "" : "s"}`
            }
          />
          <div className="max-h-[70vh] overflow-y-auto p-3">
            {loading ? (
              <p className="px-2 py-6 text-sm text-cream/40">Loading honorees…</p>
            ) : filtered.length === 0 ? (
              <HQEmptyState title="No honorees yet" description="Add an honoree to get started." />
            ) : (
              <ul className="space-y-2">
                {filtered.map((honoree) => {
                  const selected = selectedId === honoree.id;
                  const live = honoree.publishToMagazine && honoree.status === "Published";
                  return (
                    <li key={honoree.id}>
                      <button
                        type="button"
                        onClick={() => openHonoree(honoree)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                          selected
                            ? "border-gold/50 bg-gold/10"
                            : "border-gold/15 bg-black/20 hover:border-gold/35"
                        }`}
                      >
                        {honoree.graphicUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={honoree.graphicUrl}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 shrink-0 rounded-lg bg-black/40" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-medium text-cream">{honoree.name}</p>
                            <StatusBadge live={live} status={honoree.status} />
                          </div>
                          <p className="mt-1 truncate text-xs text-cream/45">{honoree.awardTitle}</p>
                        </div>
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
                title="Select or add an honoree"
                description="Choose an honoree to edit, or click Add honoree to create a new feature."
              />
            </div>
          ) : (
            <>
              <HQCardHeader
                title={editorMode === "new" ? "New honoree" : "Edit honoree"}
                subtitle={
                  isPublishedLive && existingSlug
                    ? "Live on Visionary Magazine"
                    : "Draft — not visible on the public site until published"
                }
                action={
                  isPublishedLive && existingSlug ? (
                    <Link
                      href={`/magazine/honorees/${existingSlug}`}
                      target="_blank"
                      className="text-xs text-gold hover:underline"
                    >
                      View live →
                    </Link>
                  ) : null
                }
              />
              <div className="space-y-4 p-5">
                <label className="block">
                  <span className="mb-1 block text-xs text-cream/50">Honoree name *</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={`${hqInputClass} w-full`}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-cream/50">Award title *</span>
                  <input
                    type="text"
                    value={form.awardTitle}
                    placeholder="e.g. Visionary of the Year"
                    onChange={(e) => setForm((f) => ({ ...f, awardTitle: e.target.value }))}
                    className={`${hqInputClass} w-full`}
                  />
                </label>

                <div className="block">
                  <span className="mb-1 block text-xs text-cream/50">Honoree graphic</span>
                  <div className="flex items-start gap-4">
                    {form.graphicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.graphicUrl}
                        alt="Honoree graphic preview"
                        className="max-h-40 rounded-xl border border-gold/20 object-contain"
                      />
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadGraphic(file);
                      }}
                      className={`${hqInputClass} w-full`}
                    />
                  </div>
                  {uploading ? (
                    <p className="mt-1 text-xs text-cream/40">Uploading…</p>
                  ) : null}
                </div>

                <RichTextEditor
                  label="Accomplishments / write-up"
                  value={form.accomplishments}
                  onChange={(value) => setForm((f) => ({ ...f, accomplishments: value }))}
                  placeholder="Tell their story and accomplishments…"
                  minHeight="280px"
                />

                <label className="block">
                  <span className="mb-1 block text-xs text-cream/50">Pull quote (optional)</span>
                  <input
                    type="text"
                    value={form.pullQuote}
                    onChange={(e) => setForm((f) => ({ ...f, pullQuote: e.target.value }))}
                    className={`${hqInputClass} w-full`}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-cream/50">Display order</span>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))
                    }
                    className={`${hqInputClass} w-32`}
                  />
                </label>

                <div className="flex flex-wrap gap-2 border-t border-gold/10 pt-4">
                  <HQButton disabled={busy} onClick={() => save(false)}>
                    Save draft
                  </HQButton>
                  <HQButton disabled={busy} variant="primary" onClick={() => save(true)}>
                    Publish to Visionary Magazine
                  </HQButton>
                  {isPublishedLive ? (
                    <HQButton disabled={busy} variant="outline" onClick={unpublish}>
                      Unpublish
                    </HQButton>
                  ) : null}
                  {editorMode === "edit" && selectedId ? (
                    <HQButton disabled={busy} variant="outline" onClick={remove}>
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

function StatusBadge({ live, status }: { live: boolean; status: string }) {
  if (live) return <HQBadge tone="green">Published</HQBadge>;
  if (status === "Ready") return <HQBadge tone="gold">Ready</HQBadge>;
  return <HQBadge tone="amber">Draft</HQBadge>;
}
