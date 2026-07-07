import { NextRequest, NextResponse } from "next/server";
import { handleApiFailure, safeApiHandler } from "@/lib/errors";
import { hqUnauthorizedResponse } from "@/lib/headquarters/api-auth";
import { getHQSessionUserFromRequest } from "@/lib/headquarters/auth-server";
import { listNomineeCategories } from "@/lib/nominee-categories-store";
import { listNominees } from "@/lib/nominees-store";
import { listNomineePageEntries } from "@/lib/nominee-workflows-store";
import { getNomineeVoteTallies, type HQVotingCategorySection, type HQVotingNomineeRow } from "@/lib/votes-store";
import { getVotingOpensLabel, isVotingOpen } from "@/lib/voting";

export type { HQVotingCategorySection, HQVotingNomineeRow };

export const GET = safeApiHandler(async (req: NextRequest) => {
  const user = await getHQSessionUserFromRequest(req);
  if (!user) return hqUnauthorizedResponse();

  try {
    const [nominees, categories, pageEntries, voteTallies] = await Promise.all([
      listNominees(),
      listNomineeCategories(),
      listNomineePageEntries(),
      getNomineeVoteTallies(),
    ]);

    const categoryTitleById = new Map(categories.map((category) => [category.id, category.title]));
    const graphicByNomineeCategory = new Map<string, string>();
    for (const entry of pageEntries) {
      if (entry.nomineeGraphicUrl) {
        graphicByNomineeCategory.set(`${entry.nomineeId}:${entry.categoryId}`, entry.nomineeGraphicUrl);
      }
    }

    const rows: HQVotingNomineeRow[] = nominees.map((nominee) => ({
      nomineeId: nominee.id,
      nomineeName: nominee.name,
      categoryId: nominee.categoryId,
      categoryTitle: categoryTitleById.get(nominee.categoryId) ?? "Unassigned",
      graphicUrl: graphicByNomineeCategory.get(`${nominee.id}:${nominee.categoryId}`) ?? "",
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
    const [votingOpen, opensLabel] = await Promise.all([isVotingOpen(), getVotingOpensLabel()]);

    return NextResponse.json({
      success: true,
      votingOpen,
      opensLabel,
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
