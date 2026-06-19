import { NomineesView } from "@/components/headquarters/NomineesView";
import { categoryTitleById, listNomineeCategories } from "@/lib/nominee-categories-store";
import { listNominees } from "@/lib/nominees-store";
import {
  getNomineePublishQueue,
  listNomineeMagazineArticles,
  listNomineePageEntries,
  listNomineeVotingSetups,
} from "@/lib/nominee-workflows-store";

export default async function NomineesPage() {
  const [
    nominees,
    categories,
    nomineePageEntries,
    magazineArticles,
    votingSetups,
    publishQueue,
  ] = await Promise.all([
    listNominees(),
    listNomineeCategories(),
    listNomineePageEntries(),
    listNomineeMagazineArticles(),
    listNomineeVotingSetups(),
    getNomineePublishQueue(),
  ]);

  const initialNominees = nominees.map((nominee) => ({
    ...nominee,
    categoryTitle: categoryTitleById(categories, nominee.categoryId),
  }));

  return (
    <NomineesView
      initialNominees={initialNominees}
      initialCategories={categories}
      initialNomineePageEntries={nomineePageEntries}
      initialMagazineArticles={magazineArticles}
      initialVotingSetups={votingSetups}
      initialPublishQueue={publishQueue}
    />
  );
}
