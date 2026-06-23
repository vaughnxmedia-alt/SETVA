import { redirect } from "next/navigation";
import { HQRegisterForm } from "@/components/headquarters/HQRegisterForm";
import { getHQSessionUser } from "@/lib/headquarters/auth-server";

export default async function HeadquartersRegisterPage() {
  const user = await getHQSessionUser();
  if (user) redirect("/headquarters");

  return <HQRegisterForm />;
}
