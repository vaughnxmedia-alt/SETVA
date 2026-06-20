import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { listNomineeCategories } from "@/lib/nominee-categories-store";
import {
  classifyNominationMediaFile,
  parseNominationMediaFiles,
  parseNominationMediaManifest,
  type NominationMediaImportRow,
} from "@/lib/nomination-media-import";
import { importNominationMediaPackage } from "@/lib/nomination-media-import-store";

export const POST = safeApiHandler(async (req: NextRequest) => {
  const user = getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const formData = await req.formData();
    const previewOnly = String(formData.get("preview") ?? "") === "true";
    const rowsJson = String(formData.get("rows") ?? "").trim();

    const fileEntries: { name: string; buffer: Buffer }[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "preview" || key === "rows") continue;
      if (!(value instanceof File) || !value.name) continue;
      fileEntries.push({
        name: value.name,
        buffer: Buffer.from(await value.arrayBuffer()),
      });
    }

    const manifestFile = fileEntries.find((file) =>
      classifyNominationMediaFile(file.name).kind === "manifest",
    );
    const manifestText = manifestFile ? manifestFile.buffer.toString("utf8").trim() : "";
    const mediaEntries = fileEntries.filter(
      (file) => classifyNominationMediaFile(file.name).kind !== "manifest",
    );
    if (mediaEntries.length === 0 && !rowsJson) {
      return NextResponse.json(
        { success: false, error: "Upload nomination media files or confirm an import preview." },
        { status: 400 },
      );
    }

    const classified = mediaEntries.map((file) => classifyNominationMediaFile(file.name));
    const categories = await listNomineeCategories();

    let rows: NominationMediaImportRow[] = [];
    let errors: string[] = [];
    let unmatchedVideos: string[] = [];
    let unmatchedImages: string[] = [];

    if (rowsJson) {
      rows = JSON.parse(rowsJson) as NominationMediaImportRow[];
    } else if (manifestText) {
      const parsed = parseNominationMediaManifest(manifestText, classified);
      rows = parsed.rows;
      errors = parsed.errors;
      unmatchedVideos = parsed.unmatchedVideos;
      unmatchedImages = parsed.unmatchedImages;
    } else {
      const parsed = parseNominationMediaFiles(classified, categories);
      rows = parsed.rows;
      errors = parsed.errors;
      unmatchedVideos = parsed.unmatchedVideos;
      unmatchedImages = parsed.unmatchedImages;
    }

    if (previewOnly) {
      return NextResponse.json({
        success: true,
        preview: true,
        rows,
        errors,
        unmatchedVideos,
        unmatchedImages,
      });
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No import rows to save.", errors },
        { status: 400 },
      );
    }

    const files = new Map(mediaEntries.map((file) => [file.name, file.buffer]));
    const result = await importNominationMediaPackage({
      rows,
      files,
      addedBy: { name: user.name, email: user.email },
    });

    return NextResponse.json({
      success: true,
      ...result,
      errors,
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Nomination Media Import",
      route: req.nextUrl.pathname,
      provider: "Nomination Media Import",
    });
  }
}, { workflow: "HQ Nomination Media Import" });
