"use client";

import dynamic from "next/dynamic";
import { hqInputClass } from "@/components/headquarters/ui";

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

export type MagazineArticleFormState = {
  articleTitle: string;
  nomineeBio: string;
  articleBody: string;
  pullQuote: string;
  articleImageUrl: string;
  articleStatus: string;
  nomineeId: string;
};

export function blankMagazineArticleForm(): MagazineArticleFormState {
  return {
    articleTitle: "",
    nomineeBio: "",
    articleBody: "",
    pullQuote: "",
    articleImageUrl: "",
    articleStatus: "Draft",
    nomineeId: "",
  };
}

type HonoreeOption = { id: string; name: string; awardTitle?: string };

export function MagazineArticleFields({
  form,
  setForm,
  honorees = [],
  showHonoreeLink = false,
}: {
  form: MagazineArticleFormState;
  setForm: (
    fn: MagazineArticleFormState | ((form: MagazineArticleFormState) => MagazineArticleFormState),
  ) => void;
  honorees?: HonoreeOption[];
  showHonoreeLink?: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field
        label="Article title"
        value={form.articleTitle}
        onChange={(value) => setForm((f) => ({ ...f, articleTitle: value }))}
        required
      />
      {showHonoreeLink ? (
        <label className="block">
          <span className="mb-1 block text-xs text-cream/50">Honoree</span>
          <select
            value={form.nomineeId}
            onChange={(event) => setForm((f) => ({ ...f, nomineeId: event.target.value }))}
            className={`${hqInputClass} w-full`}
          >
            <option value="">Select an honoree…</option>
            {honorees.map((honoree) => (
              <option key={honoree.id} value={honoree.id}>
                {honoree.awardTitle ? `${honoree.name} — ${honoree.awardTitle}` : honoree.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <RichTextEditor
        label="Nominee bio"
        value={form.nomineeBio}
        onChange={(value) => setForm((f) => ({ ...f, nomineeBio: value }))}
        placeholder="Introduce the subject…"
        minHeight="160px"
      />
      <RichTextEditor
        label="Article body"
        value={form.articleBody}
        onChange={(value) => setForm((f) => ({ ...f, articleBody: value }))}
        placeholder="Write the full feature article…"
        minHeight="280px"
      />
      <Field
        label="Pull quote"
        value={form.pullQuote}
        onChange={(value) => setForm((f) => ({ ...f, pullQuote: value }))}
      />
      <label className="block">
        <span className="mb-1 block text-xs text-cream/50">Featured image</span>
        <input
          type="file"
          accept="image/*"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              const articleImageUrl = await fileToDataUrl(file);
              setForm((f) => ({ ...f, articleImageUrl }));
            }
          }}
          className={`${hqInputClass} w-full`}
        />
      </label>
      {form.articleImageUrl ? (
        <img
          src={form.articleImageUrl}
          alt="Featured image preview"
          className="max-h-64 rounded-xl border border-gold/20 object-contain"
        />
      ) : null}
      <label className="block">
        <span className="mb-1 block text-xs text-cream/50">Article status</span>
        <select
          value={form.articleStatus}
          onChange={(event) => setForm((f) => ({ ...f, articleStatus: event.target.value }))}
          className={`${hqInputClass} w-full`}
        >
          <option value="Draft">Draft</option>
          <option value="Ready">Ready</option>
        </select>
      </label>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-cream/50">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="text"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className={`${hqInputClass} w-full`}
      />
    </label>
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
