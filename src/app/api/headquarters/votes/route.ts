import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, publicErrorResponse, safeApiHandler } from "@/lib/errors";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { listNomineeCategories } from "@/lib/nominee-categories-store";
import { listNominees } from "@/lib/nominees-store";
import { listNomineePageEntries } from "@/lib/nominee-workflows-store";
import { getNomineeVoteTallies, type HQVotingCategorySection, type HQVotingNomineeRow } from "@/lib/votes-store";
import { isVotingOpen, votingOpensAtIso, VOTING_OPENS_LABEL } from "@/lib/voting";

export type { HQVotingCategorySection, HQVotingNomineeRow };

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return publicErrorResponse(401);

  try {
    const [nominees, categories, pageEntries, voteTallies] = await Promise.all([
      listNominees(),
      listNomineeCategories(),
      listNomineePageEntries(),
      getNomineeVoteTallies(),
    ]);

    const categoryTitleById = new Map(categories.map((category) => [category.id, category.title]));
    const graphicByNomineeId = new Map<string, string>();
    for (const entry of pageEntries) {
      if (entry.nomineeGraphicUrl && !graphicByNomineeId.has(entry.nomineeId)) {
        graphicByNomineeId.set(entry.nomineeId, entry.nomineeGraphicUrl);
      }
    }

    const rows: HQVotingNomineeRow[] = nominees.map((nominee) => ({
      nomineeId: nominee.id,
      nomineeName: nominee.name,
      categoryId: nominee.categoryId,
      categoryTitle: categoryTitleById.get(nominee.categoryId) ?? "Unassigned",
      graphicUrl: graphicByNomineeId.get(nominee.id) ?? "",
      voteCount: voteTallies[nominee.id] ?? 0,
      categoryPercent: 0,
    }));

    const categoriesById = new Map<string, HQVotingCategorySection>();
    for (const category of categories.filter((item) => item.active)) {
      categoriesById.set(category.id, {
        categoryId: category.id,
        categoryTitle: category.title,
        totalVotes: 0,
        nominees: [],
      });
    }

    for (const row of rows) {
      const section =
        categoriesById.get(row.categoryId) ??
        categoriesById.get("unassigned") ??
        (() => {
          const fallback: HQVotingCategorySection = {
            categoryId: row.categoryId || "unassigned",
            categoryTitle: row.categoryTitle,
            totalVotes: 0,
            nominees: [],
          };
          categoriesById.set(fallback.categoryId, fallback);
          return fallback;
        })();
      section.nominees.push(row);
      section.totalVotes += row.voteCount;
    }

    const categorySections = [...categoriesById.values()]
      .map((section) => {
        const total = section.totalVotes || 1;
        return {
          ...section,
          nominees: section.nominees
            .map((nominee) => ({
              ...nominee,
              categoryPercent: section.totalVotes
                ? Math.round((nominee.voteCount / total) * 100)
                : 0,
            }))
            .sort((a, b) => b.voteCount - a.voteCount || a.nomineeName.localeCompare(b.nomineeName)),
        };
      })
      .filter((section) => section.nominees.length > 0)
      .sort((a, b) => b.totalVotes - a.totalVotes || a.categoryTitle.localeCompare(b.categoryTitle));

    const grandTotal = Object.values(voteTallies).reduce((sum, count) => sum + count, 0);
    const nomineesWithVotes = Object.keys(voteTallies).length;

    return NextResponse.json({
      success: true,
      votingOpen: isVotingOpen(),
      opensAt: votingOpensAtIso(),
      opensLabel: VOTING_OPENS_LABEL,
      grandTotal,
      nomineesWithVotes,
      categorySections,
      voteTallies,
    });
  } catch (error) {
    return handleApiFailure(error, {
      workflow: "HQ Voting",
      route: req.nextUrl.pathname,
      provider: "Vote Storage",
    });
  }
}, { workflow: "HQ Voting" });
