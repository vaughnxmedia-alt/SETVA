import { NextResponse } from "next/server";
import { safeApiHandler } from "@/lib/errors";
import { categoryIsSpecialAward } from "@/lib/nominee-category-groups";
import { listPublishedNomineePageCategories } from "@/lib/nominee-workflows-store";

export const GET = safeApiHandler(async () => {
  const categories = await listPublishedNomineePageCategories();
  return NextResponse.json({
    success: true,
    categories: categories
      .filter((category) => !categoryIsSpecialAward(category))
      .map((category) => ({
        id: category.id,
        title: category.title,
        description: "",
      })),
  });
}, { workflow: "Sponsor Categories" });
