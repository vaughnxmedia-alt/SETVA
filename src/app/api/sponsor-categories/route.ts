import { NextResponse } from "next/server";
import { listNomineeCategories } from "@/lib/nominee-categories-store";
import { safeApiHandler } from "@/lib/errors";

export const GET = safeApiHandler(async () => {
  const categories = await listNomineeCategories();
  return NextResponse.json({
    success: true,
    categories: categories
      .filter((category) => category.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((category) => ({
        id: category.id,
        title: category.title,
        description: category.description,
      })),
  });
}, { workflow: "Sponsor Categories" });
