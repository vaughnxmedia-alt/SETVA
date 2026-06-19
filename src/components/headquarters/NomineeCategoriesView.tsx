"use client";

import { useState } from "react";
import { HQShell } from "@/components/headquarters/HQShell";
import {
  HQButton,
  HQCard,
  HQCardHeader,
  hqInputClass,
} from "@/components/headquarters/ui";
import type { NomineeCategory } from "@/lib/nominees";

export function NomineeCategoriesView({
  initialCategories,
}: {
  initialCategories: NomineeCategory[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveCategories() {
    setBusy(true);
    setError(null);
    try {
      const normalized: NomineeCategory[] = categories
        .filter((category) => category.title.trim())
        .map((category, index) => ({
          ...category,
          sortOrder: index,
          status: category.publishVideo ? "Published" : "Draft",
          active: true,
        }));

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
      setMessage("Categories saved.");
    } catch {
      setError("Could not save categories.");
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
        publishVideo: false,
        active: true,
      },
    ]);
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
        Manage award categories and the category videos shown above nominee graphics.
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
              className="grid gap-3 rounded-lg border border-gold/15 bg-black/20 p-4 lg:grid-cols-[1fr_1fr_1fr_auto]"
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
              <div className="flex gap-2">
                <input
                  value={category.videoUrl}
                  onChange={(event) => updateCategory(index, { videoUrl: event.target.value })}
                  placeholder="Category video URL"
                  className={`${hqInputClass} min-w-0 flex-1`}
                />
                <label className="cursor-pointer rounded-lg border border-gold/20 bg-black/40 px-3 py-2 text-sm text-cream/70">
                  Upload
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      updateCategory(index, { videoUrl: await fileToDataUrl(file) });
                    }}
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-cream/70">
                <input
                  type="checkbox"
                  checked={category.publishVideo}
                  onChange={(event) => updateCategory(index, { publishVideo: event.target.checked })}
                />
                Publish category video
              </label>
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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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
      publishVideo: shouldPublishVideo(valueAt(cells, publishIndex), existing),
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
  if (!value) return existing?.publishVideo ?? false;
  return ["yes", "true", "published", "publish", "1"].includes(value.trim().toLowerCase());
}

function slugifyCategory(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
