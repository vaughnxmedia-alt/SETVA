import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { createVoterKey, recordNomineeVote } from "@/lib/votes-store";
import { canRecordVote, VOTER_COOKIE, VOTER_COOKIE_MAX_AGE, VOTING_STARTS_MESSAGE, isPublicVotingOpen } from "@/lib/voting";

export const POST = safeApiHandler(async (req: NextRequest) => {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
    }

    const nomineeId = String(body.nomineeId ?? "").trim();
    const pageEntryId = String(body.pageEntryId ?? "").trim();
    const categoryId = String(body.categoryId ?? "").trim();

    if (!nomineeId || !pageEntryId || !categoryId) {
      return NextResponse.json(
        { success: false, error: "Nominee, page entry, and category are required." },
        { status: 400 },
      );
    }

    if (!isPublicVotingOpen()) {
      return NextResponse.json(
        { success: false, error: VOTING_STARTS_MESSAGE },
        { status: 403 },
      );
    }

    if (!(await canRecordVote({ categoryId, nomineeId, pageEntryId }))) {
      return NextResponse.json(
        { success: false, error: "Voting is not open for this category yet." },
        { status: 403 },
      );
    }

    let voterKey = req.cookies.get(VOTER_COOKIE)?.value?.trim() ?? "";
    const setCookie = !voterKey;
    if (!voterKey) {
      voterKey = createVoterKey();
    }

    const result = await recordNomineeVote({
      nomineeId,
      pageEntryId,
      categoryId,
      voterKey,
    });

    if (result.limitReached) {
      return NextResponse.json(
        {
          success: false,
          limitReached: true,
          votesRemaining: 0,
          error: "You've used all 3 of your votes for today. Come back tomorrow to vote again.",
        },
        { status: 429 },
      );
    }

    const response = NextResponse.json({
      success: true,
      alreadyVoted: result.alreadyVoted,
      recorded: result.recorded,
      votesRemaining: result.votesRemaining,
    });

    if (setCookie) {
      response.cookies.set(VOTER_COOKIE, voterKey, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: VOTER_COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "Nominee Vote",
      route: req.nextUrl.pathname,
      provider: "Vote Storage",
    });
  }
}, { workflow: "Nominee Vote" });
