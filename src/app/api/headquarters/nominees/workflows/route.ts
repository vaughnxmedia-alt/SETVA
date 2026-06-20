import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import {
  parseNomineeMagazineArticleInput,
  parseNomineeMediaAssetInput,
  parseNomineePageEntryInput,
  parseNomineeVotingSetupInput,
} from "@/lib/nominees";
import {
  deleteNomineeMagazineArticle,
  deleteNomineeMediaAsset,
  deleteNomineePageEntry,
  deleteNomineeVotingSetup,
  getNomineePublishQueue,
  listNomineeMagazineArticles,
  listNomineeMediaAssets,
  listNomineePageEntries,
  listNomineeVotingSetups,
  saveNomineeMagazineArticle,
  saveNomineeMediaAsset,
  saveNomineePageEntry,
  saveNomineeVotingSetup,
} from "@/lib/nominee-workflows-store";
import { sanitizeMagazineHtml } from "@/lib/sanitize-html";

type WorkflowKind = "nomineePage" | "magazineArticle" | "votingSetup" | "mediaAsset";

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const [nomineePageEntries, magazineArticles, votingSetups, mediaAssets, publishQueue] =
      await Promise.all([
        listNomineePageEntries(),
        listNomineeMagazineArticles(),
        listNomineeVotingSetups(),
        listNomineeMediaAssets(),
        getNomineePublishQueue(),
      ]);

    return NextResponse.json({
      success: true,
      nomineePageEntries,
      magazineArticles,
      votingSetups,
      mediaAssets,
      publishQueue,
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominee Workflows",
      route: req.nextUrl.pathname,
      provider: "Nominee Workflow Storage",
    });
  }
}, { workflow: "HQ Nominee Workflows" });

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const kind = String(body.kind ?? "") as WorkflowKind;
    const id = String(body.id ?? "").trim() || undefined;
    const payload = (body.payload && typeof body.payload === "object"
      ? body.payload
      : body) as Record<string, unknown>;

    if (kind === "nomineePage") {
      const input = parseNomineePageEntryInput(payload, user);
      if (!input) return invalidWorkflowResponse("Select nominee and category.");
      return NextResponse.json({
        success: true,
        record: await saveNomineePageEntry(input, id),
      });
    }

    if (kind === "magazineArticle") {
      const input = parseNomineeMagazineArticleInput(payload, user);
      if (!input) return invalidWorkflowResponse("Article title is required.");
      return NextResponse.json({
        success: true,
        record: await saveNomineeMagazineArticle(
          {
            ...input,
            nomineeBio: sanitizeMagazineHtml(input.nomineeBio),
            articleBody: sanitizeMagazineHtml(input.articleBody),
          },
          id,
        ),
      });
    }

    if (kind === "votingSetup") {
      const input = parseNomineeVotingSetupInput(payload, user);
      if (!input) return invalidWorkflowResponse("Select a category.");
      return NextResponse.json({
        success: true,
        record: await saveNomineeVotingSetup(input, id),
      });
    }

    if (kind === "mediaAsset") {
      const input = parseNomineeMediaAssetInput(payload, user);
      if (!input) return invalidWorkflowResponse("File name and URL are required.");
      return NextResponse.json({
        success: true,
        record: await saveNomineeMediaAsset(input, id),
      });
    }

    return invalidWorkflowResponse("Unknown nominee workflow.");
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominee Workflows",
      route: req.nextUrl.pathname,
      provider: "Nominee Workflow Storage",
    });
  }
}, { workflow: "HQ Nominee Workflows" });

export const DELETE = safeApiHandler(async (req: NextRequest) => {
  const user = getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const { searchParams } = req.nextUrl;
    const kind = searchParams.get("kind") as WorkflowKind | null;
    const id = searchParams.get("id") ?? "";
    if (!kind || !id) return invalidWorkflowResponse("Workflow kind and id are required.");

    const deleted =
      kind === "nomineePage"
        ? await deleteNomineePageEntry(id)
        : kind === "magazineArticle"
          ? await deleteNomineeMagazineArticle(id)
          : kind === "votingSetup"
            ? await deleteNomineeVotingSetup(id)
            : kind === "mediaAsset"
              ? await deleteNomineeMediaAsset(id)
              : false;

    return NextResponse.json({ success: deleted });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nominee Workflows",
      route: req.nextUrl.pathname,
      provider: "Nominee Workflow Storage",
    });
  }
}, { workflow: "HQ Nominee Workflows" });

function invalidWorkflowResponse(error: string): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 400 });
}
