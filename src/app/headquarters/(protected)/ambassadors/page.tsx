import { AmbassadorsView } from "@/components/headquarters/AmbassadorsView";
import { getHQAmbassadors } from "@/lib/headquarters/data";

export default async function AmbassadorsPage() {
  const ambassadors = await getHQAmbassadors();
  return <AmbassadorsView ambassadors={ambassadors} />;
}
