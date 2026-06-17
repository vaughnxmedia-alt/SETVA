import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/lib/site";
import { PUBLIC_ERROR_MESSAGE } from "@/lib/errors/constants";
import { sanitizeMetadata } from "@/lib/errors/sanitize";

export { PUBLIC_ERROR_MESSAGE };

export type ErrorContext = {
  workflow: string;
  route: string;
  provider?: string;
  contactEmail?: string;
  companyName?: string;
  metadata?: Record<string, unknown>;
};

export type InternalErrorRecord = ErrorContext & {
  timestamp: string;
  environment: string;
  error: string;
  stack?: string;
};

export function getErrorContext(
  context: ErrorContext,
): InternalErrorRecord & { metadata?: Record<string, unknown> } {
  return {
    ...context,
    metadata: sanitizeMetadata(context.metadata),
    timestamp: new Date().toISOString(),
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    error: "",
  };
}

export function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export function logInternalError(error: unknown, context: ErrorContext): void {
  const { message, stack } = normalizeError(error);
  const record: InternalErrorRecord = {
    ...getErrorContext(context),
    error: message,
    stack,
  };

  if (process.env.NODE_ENV === "development") {
    console.error("[SETVA internal error]", record);
    return;
  }

  console.error(JSON.stringify({ level: "error", ...record }));
}

function errorNotifyFromAddress(): string {
  return (
    process.env.SPONSOR_DECK_FROM_EMAIL?.trim() ??
    "SETVA Errors <onboarding@resend.dev>"
  );
}

function errorNotifyToAddress(): string | null {
  return (
    process.env.ERROR_NOTIFY_EMAIL?.trim() ??
    process.env.SPONSOR_DECK_NOTIFY_EMAIL?.trim() ??
    site.contact.email
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildInternalErrorEmailHtml(
  record: InternalErrorRecord,
  context: ErrorContext,
): string {
  const metadataHtml = record.metadata
    ? `<pre style="background:#f4f4f4;padding:12px;border-radius:8px;overflow:auto;font-size:12px;">${escapeHtml(JSON.stringify(record.metadata, null, 2))}</pre>`
    : "";

  return `
    <div style="font-family:system-ui,sans-serif;color:#111;max-width:640px;">
      <h2 style="margin:0 0 12px;">Internal error report</h2>
      <p><strong>Workflow:</strong> ${escapeHtml(context.workflow)}</p>
      <p><strong>Route:</strong> ${escapeHtml(context.route)}</p>
      <p><strong>Provider:</strong> ${escapeHtml(context.provider ?? "—")}</p>
      <p><strong>Environment:</strong> ${escapeHtml(record.environment)}</p>
      <p><strong>Timestamp:</strong> ${escapeHtml(record.timestamp)}</p>
      ${context.contactEmail ? `<p><strong>Contact email:</strong> ${escapeHtml(context.contactEmail)}</p>` : ""}
      ${context.companyName ? `<p><strong>Company:</strong> ${escapeHtml(context.companyName)}</p>` : ""}
      <p><strong>Error:</strong> ${escapeHtml(record.error)}</p>
      ${record.stack ? `<pre style="background:#f4f4f4;padding:12px;border-radius:8px;overflow:auto;font-size:11px;white-space:pre-wrap;">${escapeHtml(record.stack)}</pre>` : ""}
      ${metadataHtml}
    </div>
  `.trim();
}

export async function notifyTeamOfError(
  error: unknown,
  context: ErrorContext,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = errorNotifyToAddress();
  if (!apiKey || !to) return;

  const { message, stack } = normalizeError(error);
  const record = {
    ...getErrorContext(context),
    error: message,
    stack,
  };

  try {
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: errorNotifyFromAddress(),
      to,
      subject: `[SETVA] ${context.workflow} error`,
      html: buildInternalErrorEmailHtml(record, context),
    });
  } catch (notifyError) {
    logInternalError(notifyError, {
      workflow: "Error Notification",
      route: "notifyTeamOfError",
      provider: "Resend",
      metadata: { originalWorkflow: context.workflow },
    });
  }
}

export function publicErrorResponse(status = 500): NextResponse {
  return NextResponse.json(
    { success: false, message: PUBLIC_ERROR_MESSAGE },
    { status },
  );
}

export async function handleApiFailure(
  error: unknown,
  context: ErrorContext,
  options?: { status?: number; notifyTeam?: boolean },
): Promise<NextResponse> {
  const status = options?.status ?? 500;
  const notifyTeam = options?.notifyTeam ?? status >= 500;

  logInternalError(error, context);
  if (notifyTeam) {
    await notifyTeamOfError(error, context);
  }

  return publicErrorResponse(status);
}

export function safeApiHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  context: Omit<ErrorContext, "route">,
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      return await handleApiFailure(error, {
        ...context,
        route: req.nextUrl.pathname,
      });
    }
  };
}
