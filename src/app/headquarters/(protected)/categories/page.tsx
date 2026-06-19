import { NomineeCategoriesView } from "@/components/headquarters/NomineeCategoriesView";
import { listNomineeCategories } from "@/lib/nominee-categories-store";

export default async function CategoriesPage() {
  const categories = await listNomineeCategories();
  return <NomineeCategoriesView initialCategories={categories} />;
}
