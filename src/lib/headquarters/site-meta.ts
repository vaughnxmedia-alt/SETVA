import { site } from "@/lib/site";

export const hqEventDate = new Date("2026-08-08T17:00:00");

export function daysUntilEvent(): number {
  const now = new Date();
  const diff = hqEventDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export const hqBranding = {
  title: "SETVA Headquarters",
  subtitle: "Southeast Texas Visionary Awards · Mont City Network",
  event: site.event.title,
  eventDate: site.event.dateLabel,
};
