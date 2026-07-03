import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { getTicketSalesReconciliation } from "@/lib/headquarters/data";
import {
  clearTicketPurchases,
  createImportBatchId,
  saveTicketPurchases,
} from "@/lib/ticket-partner/purchases-store";
import { parseTicketmasterExport } from "@/lib/ticket-partner/reconcile";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const reconciliation = await getTicketSalesReconciliation();
    return NextResponse.json({ success: true, reconciliation });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Ticket Sales",
      route: req.nextUrl.pathname,
      provider: "Ticket Sales Storage",
    });
  }
}, { workflow: "HQ Ticket Sales" });

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    let body: { csv?: string };
    try {
      body = (await req.json()) as { csv?: string };
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
    }

    const parsed = parseTicketmasterExport(body.csv ?? "");
    if (parsed.error) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    if (parsed.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No buyer rows were found in the export." },
        { status: 400 },
      );
    }

    const batchId = createImportBatchId();
    const saved = await saveTicketPurchases(parsed.rows, batchId);
    const reconciliation = await getTicketSalesReconciliation();

    return NextResponse.json({
      success: true,
      imported: saved,
      skipped: parsed.skipped,
      columns: parsed.columns,
      reconciliation,
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Ticket Sales",
      route: req.nextUrl.pathname,
      provider: "Ticket Sales Storage",
    });
  }
}, { workflow: "HQ Ticket Sales" });

export const DELETE = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const removed = await clearTicketPurchases();
    const reconciliation = await getTicketSalesReconciliation();
    return NextResponse.json({ success: true, removed, reconciliation });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Ticket Sales",
      route: req.nextUrl.pathname,
      provider: "Ticket Sales Storage",
    });
  }
}, { workflow: "HQ Ticket Sales" });
