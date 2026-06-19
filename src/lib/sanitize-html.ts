import DOMPurify from "isomorphic-dompurify";

const MAGAZINE_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "span",
  "div",
];

const MAGAZINE_ALLOWED_ATTR = ["href", "target", "rel", "style", "class"];

export function sanitizeMagazineHtml(html: string): string {
  if (!html.trim()) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: MAGAZINE_ALLOWED_TAGS,
    ALLOWED_ATTR: MAGAZINE_ALLOWED_ATTR,
  });
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function plainTextToMagazineHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph
        .split(/\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => escapeHtml(line))
        .join("<br>");
      return `<p>${lines}</p>`;
    })
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
