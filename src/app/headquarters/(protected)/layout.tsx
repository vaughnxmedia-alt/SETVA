import { redirect } from "next/navigation";
import { HQProtectedClient } from "@/components/headquarters/HQProtectedClient";
import { getHQSessionUser } from "@/lib/headquarters/auth-server";

export default async function ProtectedHeadquartersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getHQSessionUser();
  if (!user) redirect("/headquarters/login");
  return <HQProtectedClient>{children}</HQProtectedClient>;
}
