"use client";

import { useMemo, useState } from "react";
import {
  HQButton,
  HQCard,
  HQCardHeader,
  hqInputClass,
} from "@/components/headquarters/ui";
import {
  nominationMediaManifestTemplate,
  type NominationMediaImportRow,
} from "@/lib/nomination-media-import";

type NominationMediaImportProps = {
  onComplete?: () => void | Promise<void>;
};

export function NominationMediaImport({ onComplete }: NominationMediaImportProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<NominationMediaImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewReady, setPreviewReady] = useState(false);

  const hasMissingNomineeNames = useMemo(
    () => rows.some((row) => !row.nomineeName.trim()),
    [rows],
  );

  async function buildFormData(preview: boolean) {
    const formData = new FormData();
    formData.set("preview", preview ? "true" : "false");
    if (!preview && rows.length) formData.set("rows", JSON.stringify(rows));
    for (const file of files) {
      formData.append("files", file, file.name);
    }
    return formData;
  }

  async function previewImport() {
    if (files.length === 0) {
      setErrors(["Choose nomination media files to import."]);
      return;
    }

    setBusy(true);
    setMessage(null);
    setErrors([]);
    try {
      const res = await fetch("/api/headquarters/nomination-media/import", {
        method: "POST",
        body: await buildFormData(true),
      });
      const data = (await res.json()) as {
        success?: boolean;
        rows?: NominationMediaImportRow[];
        errors?: string[];
        error?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Could not preview import.");
      }

      setRows(data.rows ?? []);
      setErrors(data.errors ?? []);
      setPreviewReady(true);
      setMessage("Review the matched categories and nominee names, then confirm import.");
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Could not preview import."]);
      setPreviewReady(false);
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (rows.length === 0) return;
    if (hasMissingNomineeNames) {
      setErrors(["Fill in every nominee name before importing."]);
      return;
    }

    setBusy(true);
    setMessage(null);
    setErrors([]);
    try {
      const res = await fetch("/api/headquarters/nomination-media/import", {
        method: "POST",
        body: await buildFormData(false),
      });
      const data = (await res.json()) as {
        success?: boolean;
        nominees?: number;
        pageEntries?: number;
        skipped?: string[];
        errors?: string[];
        error?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Import failed.");
      }

      setMessage(
        `Imported ${data.nominees ?? 0} nominee${data.nominees === 1 ? "" : "s"} across ${data.pageEntries ?? 0} page entr${data.pageEntries === 1 ? "y" : "ies"}.`,
      );
      setPreviewReady(false);
      setRows([]);
      setFiles([]);
      if (data.skipped?.length) {
        setErrors(data.skipped);
      }
      await onComplete?.();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Import failed."]);
    } finally {
      setBusy(false);
    }
  }

  function updateRow(index: number, patch: Partial<NominationMediaImportRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function downloadTemplate() {
    const blob = new Blob([nominationMediaManifestTemplate], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nomination-media-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <HQCard className="mb-6">
      <HQCardHeader
        title="Import nomination media package"
        subtitle="Upload category videos and nominee graphics from a delivery folder like NOMINATION VIDEO-2."
        action={
          <HQButton variant="outline" onClick={downloadTemplate}>
            Download CSV template
          </HQButton>
        }
      />
      <div className="space-y-4 p-5">
        <p className="text-sm text-cream/55">
          Upload `.mp4` category videos and nominee `.png` graphics together. We auto-match videos to
          graphics when filenames are close, like `VISIONARY OF THE YEAR.mp4` with `VISIONARY.png`.
          You can also include a CSV manifest in the same upload for exact nominee mapping.
        </p>

        <label className="block">
          <span className="mb-1 block text-xs text-cream/50">Media files</span>
          <input
            type="file"
            multiple
            accept="video/*,image/*,.csv,text/csv"
            className={`${hqInputClass} w-full`}
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? []);
              event.currentTarget.value = "";
              setFiles(selected);
              setPreviewReady(false);
              setRows([]);
            }}
          />
        </label>

        {files.length ? (
          <p className="text-xs text-cream/45">
            {files.length} file{files.length === 1 ? "" : "s"} selected:{" "}
            {files.map((file) => file.name).join(", ")}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <HQButton disabled={busy} onClick={previewImport}>
            Preview import
          </HQButton>
          {previewReady ? (
            <HQButton disabled={busy || hasMissingNomineeNames} variant="primary" onClick={confirmImport}>
              Confirm import
            </HQButton>
          ) : null}
        </div>

        {message ? (
          <p className="rounded-lg border border-emerald/30 bg-emerald/10 px-4 py-2 text-sm text-emerald-light">
            {message}
          </p>
        ) : null}
        {errors.length ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <ul className="list-disc space-y-1 pl-5">
              {errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {previewReady && rows.length ? (
          <div className="overflow-x-auto rounded-xl border border-gold/15">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gold/10 bg-black/30 text-xs uppercase tracking-wide text-cream/45">
                <tr>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Video</th>
                  <th className="px-3 py-2">Graphic</th>
                  <th className="px-3 py-2">Nominee</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.categoryId}-${index}`} className="border-b border-gold/10">
                    <td className="px-3 py-2 align-top">
                      <input
                        value={row.categoryTitle}
                        onChange={(event) => updateRow(index, { categoryTitle: event.target.value })}
                        className={`${hqInputClass} min-w-[180px]`}
                      />
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-cream/60">{row.videoFileName || "—"}</td>
                    <td className="px-3 py-2 align-top text-xs text-cream/60">{row.graphicFileName || "—"}</td>
                    <td className="px-3 py-2 align-top">
                      <input
                        value={row.nomineeName}
                        onChange={(event) => updateRow(index, { nomineeName: event.target.value })}
                        placeholder="Nominee name"
                        className={`${hqInputClass} min-w-[220px]`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </HQCard>
  );
}
