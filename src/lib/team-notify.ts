import { site } from "@/lib/site";

/** Inboxes that receive internal alerts when a public form is submitted. */
export function teamNotifyEmails(): string[] {
  const raw =
    process.env.SPONSOR_DECK_NOTIFY_EMAIL?.trim() ||
    process.env.HEADQUARTERS_NOTIFY_EMAILS?.trim() ||
    `${site.contact.email},setvaawards@gmail.com`;

  return [...new Set(raw.split(",").map((email) => email.trim()).filter(Boolean))];
}

/** Primary team inbox for modules that only support one recipient. */
export function teamNotifyEmail(): string {
  return teamNotifyEmails()[0] ?? site.contact.email;
}
