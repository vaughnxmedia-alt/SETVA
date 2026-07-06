import type { FormSubmissionRecord } from "@/lib/form-submissions";

const MOCK_EMAIL_DOMAINS = new Set(["example.com", "test.com", "localhost"]);
const MOCK_EMAILS = new Set(["onboarding@resend.dev"]);

function emailLooksMock(value: string): boolean {
  const email = value.trim().toLowerCase();
  if (!email) return false;
  if (MOCK_EMAILS.has(email)) return true;
  const domain = email.split("@")[1];
  return Boolean(domain && MOCK_EMAIL_DOMAINS.has(domain));
}

/** Returns true for test/demo submissions that should not appear in HQ or production analytics. */
export function isMockFormSubmission(record: FormSubmissionRecord): boolean {
  const emails = [
    record.contact_email ?? "",
    typeof record.payload.email === "string" ? record.payload.email : "",
  ];

  if (emails.some(emailLooksMock)) return true;

  const status = record.status.toLowerCase();
  if (status.includes("demo")) return true;

  if (record.payload.demo === true) return true;

  return false;
}
