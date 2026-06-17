import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HQLoginForm } from "@/components/headquarters/HQLoginForm";
import { getHQSessionUser } from "@/lib/headquarters/auth-server";

export default async function HeadquartersLoginPage() {
  const user = await getHQSessionUser();
  if (user) redirect("/headquarters");

  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <HQLoginForm />
    </Suspense>
  );
}
