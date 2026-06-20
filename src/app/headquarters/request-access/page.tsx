import { redirect } from "next/navigation";
import { HQRequestAccessForm } from "@/components/headquarters/HQRequestAccessForm";
import { getHQSessionUser } from "@/lib/headquarters/auth-server";

export default async function HeadquartersRequestAccessPage() {
  const user = await getHQSessionUser();
  if (user) redirect("/headquarters");

  return <HQRequestAccessForm />;
}
