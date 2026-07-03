"use client";

import { useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import {
  HQButton,
  HQCard,
  HQCardHeader,
  HQBadge,
  hqInputClass,
} from "@/components/headquarters/ui";
import type { NomineeCategory } from "@/lib/nominees";
import { NominationMediaImport } from "@/components/headquarters/NominationMediaImport";
import { generateVideoPoster } from "@/lib/video-thumbnail";

export function NomineeCategoriesView({
  initialCategories,
}: {
  initialCategories: NomineeCategory[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [pendingVideoFiles, setPendingVideoFiles] = useState<Record<string, File>>({});
  const [pendingPosterFiles, setPendingPosterFiles] = useState<Record<string, File>>({});
  const [posterPreviews, setPosterPreviews] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadCategoryMedia(
    category: NomineeCategory,
    file?: File,
    poster?: File,
  ): Promise<{ url?: string; posterUrl?: string }> {
    const formData = new FormData();
    formData.append("categoryId", category.id);
    if (file) formData.append("file", file);
    if (poster) formData.append("poster", poster);
    if (category.videoUrl && !category.videoUrl.startsWith("blob:")) {
      formData.append("existingUrl", category.videoUrl);
    }

    const res = await fetch("/api/headquarters/nominee-categories/media", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Video upload failed");
    const data = (await res.json()) as { url?: string; posterUrl?: string };
    if (file && !data.url) throw new Error("Video upload failed");
    return { url: data.url, posterUrl: data.posterUrl };
  }

  async function saveCategories() {
    setBusy(true);
    setError(null);
    try {
      const normalized: NomineeCategory[] = [];
      for (const [index, category] of categories
        .filter((item) => item.title.trim())
        .entries()) {
        let videoUrl = category.videoUrl.startsWith("blob:") ? "" : category.videoUrl;
        let videoPosterUrl = category.videoPosterUrl ?? "";
        const pendingFile = pendingVideoFiles[category.id];
        const pendingPoster = pendingPosterFiles[category.id];
        if (pendingFile || pendingPoster) {
          const uploaded = await uploadCategoryMedia(category, pendingFile, pendingPoster);
          if (uploaded.url) videoUrl = uploaded.url;
          if (uploaded.posterUrl) videoPosterUrl = uploaded.posterUrl;
        }

        const isLive = category.status === "Published";
        normalized.push({
          ...category,
          sortOrder: index,
          videoUrl,
          videoPosterUrl,
          status: isLive ? "Published" : "Draft",
          publishVideo: isLive && Boolean(videoUrl),
          active: true,
        });
      }

      const res = await fetch("/api/headquarters/nominee-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: normalized }),
      });
      if (!res.ok) throw new Error("Save failed");

      const data = (await res.json()) as {
        categories?: NomineeCategory[];
      };
      setCategories(data.categories ?? normalized);
      setPendingVideoFiles({});
      setPendingPosterFiles({});
      setPosterPreviews({});
      setMessage("Categories saved internally.");
    } catch {
      setError("Could not save categories.");
    } finally {
      setBusy(false);
    }
  }

  async function publishCategory(index: number) {
    const category = categories[index];
    if (!category?.title.trim()) return;

    setBusy(true);
    setError(null);
    try {
      let videoUrl = category.videoUrl.startsWith("blob:") ? "" : category.videoUrl;
      let videoPosterUrl = category.videoPosterUrl ?? "";
      const pendingFile = pendingVideoFiles[category.id];
      const pendingPoster = pendingPosterFiles[category.id];
      if (pendingFile || pendingPoster) {
        const uploaded = await uploadCategoryMedia(category, pendingFile, pendingPoster);
        if (uploaded.url) videoUrl = uploaded.url;
        if (uploaded.posterUrl) videoPosterUrl = uploaded.posterUrl;
      }

      const normalized = categories
        .filter((item) => item.title.trim())
        .map((item, itemIndex) => {
          const isTarget = item.id === category.id;
          const nextVideoUrl = isTarget ? videoUrl : item.videoUrl;
          const nextPosterUrl = isTarget ? videoPosterUrl : item.videoPosterUrl ?? "";
          const isLive = isTarget ? true : item.status === "Published";
          return {
            ...item,
            sortOrder: itemIndex,
            videoUrl: nextVideoUrl,
            videoPosterUrl: nextPosterUrl,
            status: isLive ? "Published" : "Draft",
            publishVideo: isLive && Boolean(nextVideoUrl),
            active: true,
          } as NomineeCategory;
        });

      const res = await fetch("/api/headquarters/nominee-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: normalized }),
      });
      if (!res.ok) throw new Error("Publish failed");

      const data = (await res.json()) as { categories?: NomineeCategory[] };
      setCategories(data.categories ?? normalized);
      setPendingVideoFiles((current) => {
        const next = { ...current };
        delete next[category.id];
        return next;
      });
      setPendingPosterFiles((current) => {
        const next = { ...current };
        delete next[category.id];
        return next;
      });
      setPosterPreviews((current) => {
        const next = { ...current };
        delete next[category.id];
        return next;
      });
      setMessage(`Published ${category.title} to the nominations page.`);
    } catch {
      setError("Could not publish category.");
    } finally {
      setBusy(false);
    }
  }

  function updateCategory(index: number, patch: Partial<NomineeCategory>) {
    setCategories((prev) =>
      prev.map((category, i) => (i === index ? { ...category, ...patch } : category)),
    );
  }

  function addCategory() {
    setCategories((prev) => [
      ...prev,
      {
        id: `category-${Date.now()}`,
        title: "",
        description: "",
        sortOrder: prev.length,
        status: "Draft",
        videoMediaId: "",
        videoUrl: "",
        videoPosterUrl: "",
        publishVideo: false,
        active: true,
      },
    ]);
  }

  async function refreshCategories() {
    const res = await fetch("/api/headquarters/nominee-categories");
    if (!res.ok) return;
    const data = (await res.json()) as { categories?: NomineeCategory[] };
    setCategories(data.categories ?? []);
  }

  async function importSpreadsheet(csv: string) {
    setBusy(true);
    setError(null);
    try {
      const parsed = parseCategorySpreadsheet(csv, categories);
      if (parsed.categories.length === 0) {
        setError("No categories found in that CSV.");
        return;
      }

      const res = await fetch("/api/headquarters/nominee-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: parsed.categories }),
      });
      if (!res.ok) throw new Error("Category import failed");

      const data = (await res.json()) as {
        categories?: NomineeCategory[];
      };
      setCategories(data.categories ?? parsed.categories);

      if (parsed.hasNominees) {
        const addNominees = window.confirm(
          "This spreadsheet also has nominees. Do you want to add those nominees now?",
        );
        if (addNominees) {
          const nomineeRes = await fetch("/api/headquarters/nominees/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ csv }),
          });
          const nomineeData = (await nomineeRes.json()) as {
            imported?: number;
            errors?: string[];
          };
          if (!nomineeRes.ok) {
            setMessage("Categories imported. Nominees were not added.");
            setError(nomineeData.errors?.join(" ") ?? "Could not add nominees from the CSV.");
            return;
          }
          setMessage(
            `Imported ${parsed.categories.length} categor${parsed.categories.length === 1 ? "y" : "ies"} and ${nomineeData.imported ?? 0} nominee${nomineeData.imported === 1 ? "" : "s"}.`,
          );
          return;
        }
      }

      setMessage(
        `Imported ${parsed.categories.length} categor${parsed.categories.length === 1 ? "y" : "ies"}.`,
      );
    } catch {
      setError("Could not import that CSV.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <HQShell title="Categories">
      <p className="mb-5 text-sm text-cream/50">
        Save categories and videos internally. Publishing to the live nominations page is manual.
      </p>

      {message ? (
        <p className="mb-4 rounded-lg border border-emerald/30 bg-emerald/10 px-4 py-2 text-sm text-emerald-light">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <NominationMediaImport onComplete={refreshCategories} />

      <HQCard>
        <HQCardHeader
          title="Categories"
          subtitle="Keep this simple: name, optional description, video, and publish setting."
          action={
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-lg border border-gold/20 px-3 py-1.5 text-sm font-medium text-cream/80 transition hover:border-gold/40 hover:text-gold">
                Upload CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.currentTarget.value = "";
                    if (!file) return;
                    await importSpreadsheet(await file.text());
                  }}
                />
              </label>
              <HQButton onClick={saveCategories} disabled={busy}>
                Save Categories
              </HQButton>
            </div>
          }
        />
        <div className="space-y-3 p-5">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="grid min-h-[8rem] items-center gap-3 rounded-lg border border-gold/15 bg-black/20 p-4 lg:grid-cols-[1fr_1fr_1fr_auto_auto]"
            >
              <input
                value={category.title}
                onChange={(event) => updateCategory(index, { title: event.target.value })}
                placeholder="Category name"
                className={hqInputClass}
              />
              <input
                value={category.description}
                onChange={(event) => updateCategory(index, { description: event.target.value })}
                placeholder="Description (optional)"
                className={hqInputClass}
              />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CategoryVideoPreview
                    category={category}
                    pendingFile={pendingVideoFiles[category.id]}
                    posterOverride={posterPreviews[category.id] || category.videoPosterUrl}
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <label className="cursor-pointer rounded-lg border border-gold/20 bg-black/40 px-3 py-1.5 text-center text-xs text-cream/75 transition hover:border-gold/40 hover:text-gold">
                      {categoryHasVideo(category, pendingVideoFiles[category.id])
                        ? "Replace video"
                        : "Upload video (.mp4)"}
                      <input
                        type="file"
                        accept="video/mp4,video/*"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          event.currentTarget.value = "";
                          if (!file) return;
                          setPendingVideoFiles((current) => ({ ...current, [category.id]: file }));
                          updateCategory(index, { videoUrl: URL.createObjectURL(file) });
                          const poster = await generateVideoPoster(file);
                          if (poster) {
                            setPendingPosterFiles((current) => ({ ...current, [category.id]: poster }));
                            setPosterPreviews((current) => ({
                              ...current,
                              [category.id]: URL.createObjectURL(poster),
                            }));
                          }
                        }}
                      />
                    </label>
                    {categoryHasVideo(category, pendingVideoFiles[category.id]) ? (
                      <label className="cursor-pointer text-center text-[11px] font-medium text-gold/80 transition hover:text-gold">
                        Replace thumbnail
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.currentTarget.value = "";
                            if (!file) return;
                            setPendingPosterFiles((current) => ({ ...current, [category.id]: file }));
                            setPosterPreviews((current) => ({
                              ...current,
                              [category.id]: URL.createObjectURL(file),
                            }));
                          }}
                        />
                      </label>
                    ) : null}
                  </div>
                </div>
                <p className="min-h-[1rem] truncate text-[11px] text-cream/45" title={category.videoUrl}>
                  {pendingVideoFiles[category.id]
                    ? `${pendingVideoFiles[category.id].name} — save to upload`
                    : savedVideoLabel(category.videoUrl)
                      ? `Saved: ${savedVideoLabel(category.videoUrl)}`
                      : ""}
                </p>
              </div>
              <div className="flex min-w-[7rem] flex-col items-start gap-2">
                <HQBadge tone={category.status === "Published" ? "green" : "amber"}>
                  {category.status === "Published" ? "Live" : "Draft"}
                </HQBadge>
                {category.status !== "Published" ? (
                  <HQButton
                    variant="outline"
                    className="px-2.5 py-1 text-xs"
                    disabled={busy || !category.videoUrl}
                    onClick={() => publishCategory(index)}
                  >
                    Publish to site
                  </HQButton>
                ) : (
                  <span className="text-[11px] text-cream/40">Published</span>
                )}
              </div>
            </div>
          ))}
          <HQButton variant="outline" onClick={addCategory} disabled={busy}>
            Add Category
          </HQButton>
        </div>
      </HQCard>
    </HQShell>
  );
}

function categoryHasVideo(category: NomineeCategory, pendingFile?: File): boolean {
  if (pendingFile) return true;
  const url = category.videoUrl.trim();
  return Boolean(url && !url.startsWith("blob:"));
}

function resolveCategoryMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("blob:")) return trimmed;
  // Relative paths work in the browser and avoid SSR/client hydration mismatches.
  if (trimmed.startsWith("/")) return trimmed;
  return trimmed;
}

function savedVideoLabel(videoUrl: string): string {
  const trimmed = videoUrl.trim();
  if (!trimmed || trimmed.startsWith("blob:")) return "";
  if (trimmed.startsWith("http")) {
    try {
      const pathname = new URL(trimmed).pathname;
      return pathname.split("/").slice(-2).join("/") || "video.mp4";
    } catch {
      return "video.mp4";
    }
  }
  return trimmed.replace(/^\//, "");
}

function CategoryVideoPreview({
  category,
  pendingFile,
  posterOverride,
}: {
  category: NomineeCategory;
  pendingFile?: File;
  posterOverride?: string;
}) {
  const savedUrl = category.videoUrl.trim();
  const hasSavedVideo = Boolean(savedUrl && !savedUrl.startsWith("blob:"));
  const videoSrc = pendingFile
    ? savedUrl.startsWith("blob:")
      ? savedUrl
      : URL.createObjectURL(pendingFile)
    : hasSavedVideo
      ? resolveCategoryMediaUrl(savedUrl)
      : "";

  if (posterOverride) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={posterOverride}
        alt={`${category.title || "Category"} video thumbnail`}
        className="h-12 w-20 shrink-0 rounded-md border border-gold/20 object-cover"
      />
    );
  }

  if (videoSrc) {
    return (
      <video
        src={videoSrc}
        muted
        playsInline
        preload="metadata"
        className="h-12 w-20 shrink-0 rounded-md border border-gold/20 bg-black object-cover"
      />
    );
  }

  return (
    <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-gold/20 bg-black/30 text-center text-[10px] leading-tight text-cream/40">
      No video
    </div>
  );
}

function parseCategorySpreadsheet(
  csv: string,
  currentCategories: NomineeCategory[],
): { categories: NomineeCategory[]; hasNominees: boolean } {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { categories: currentCategories, hasNominees: false };

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const categoryIndex = findHeader(headers, [
    "category",
    "category name",
    "award category",
    "nomination category",
  ]);
  const descriptionIndex = findHeader(headers, ["description", "category description"]);
  const videoIndex = findHeader(headers, ["category video", "category video url", "video", "video url"]);
  const publishIndex = findHeader(headers, ["publish category video", "publish video"]);
  const nomineeIndex = findHeader(headers, ["nominee", "nominee name", "name", "full name"]);

  if (categoryIndex === -1) return { categories: [], hasNominees: false };

  const byKey = new Map(currentCategories.map((category) => [category.title.toLowerCase(), category]));
  let hasNominees = false;

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const cells = parseCsvLine(lines[lineIndex]);
    const title = (cells[categoryIndex] ?? "").trim();
    if (!title) continue;

    if (nomineeIndex !== -1 && (cells[nomineeIndex] ?? "").trim()) {
      hasNominees = true;
    }

    const key = title.toLowerCase();
    const existing = byKey.get(key);
    byKey.set(key, {
      id: existing?.id ?? slugifyCategory(title),
      title,
      description: valueAt(cells, descriptionIndex) || existing?.description || "",
      sortOrder: existing?.sortOrder ?? byKey.size,
      status: shouldPublishVideo(valueAt(cells, publishIndex), existing)
        ? "Published"
        : existing?.status ?? "Draft",
      videoMediaId: existing?.videoMediaId ?? "",
      videoUrl: valueAt(cells, videoIndex) || existing?.videoUrl || "",
      videoPosterUrl: existing?.videoPosterUrl ?? "",
      publishVideo: shouldPublishVideo(valueAt(cells, publishIndex), existing) && Boolean(
        valueAt(cells, videoIndex) || existing?.videoUrl,
      ),
      active: true,
    });
  }

  return {
    categories: Array.from(byKey.values()).map((category, index) => ({
      ...category,
      sortOrder: index,
    })),
    hasNominees,
  };
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function findHeader(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

function valueAt(cells: string[], index: number): string {
  return index === -1 ? "" : (cells[index] ?? "").trim();
}

function shouldPublishVideo(value: string, existing?: NomineeCategory): boolean {
  if (!value) return existing?.status === "Published" && existing.publishVideo;
  return ["yes", "true", "published", "publish", "1"].includes(value.trim().toLowerCase());
}

function slugifyCategory(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
