import "server-only";

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
