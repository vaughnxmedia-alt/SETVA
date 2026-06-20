import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HQActivateForm } from "@/components/headquarters/HQActivateForm";
import { getHQSessionUser } from "@/lib/headquarters/auth-server";

export default async function HeadquartersActivatePage() {
  const user = await getHQSessionUser();
  if (user) redirect("/headquarters");

  return (
    <Suspense fallback={null}>
      <HQActivateForm />
    </Suspense>
  );
}
