import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { verifyDeckAccessToken } from "@/lib/deck-access";
import {
  handleApiFailure,
  safeApiHandler,
} from "@/lib/errors";
import { sponsorDeck } from "@/lib/sponsor-deck";

const deckFilePath = path.join(
  process.cwd(),
  "private",
  "sponsor-deck",
  sponsorDeck.fileName,
);

export const GET = safeApiHandler(async (req: NextRequest) => {
  const token = req.nextUrl.searchParams.get("access")?.trim();
  if (!token || !verifyDeckAccessToken(token)) {
    return handleApiFailure(new Error("Invalid or expired deck access token"), {
      workflow: "Sponsor Deck Document",
      route: req.nextUrl.pathname,
      metadata: { reason: "invalid_access_token" },
    }, { status: 403, notifyTeam: false });
  }

  let file: Buffer;
  try {
    file = await readFile(deckFilePath);
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Sponsor Deck Document",
      route: req.nextUrl.pathname,
      metadata: { reason: "deck_file_missing" },
    }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${sponsorDeck.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}, { workflow: "Sponsor Deck Document" });
