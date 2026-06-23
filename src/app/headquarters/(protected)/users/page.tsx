import { redirect } from "next/navigation";
import { UsersView } from "@/components/headquarters/UsersView";
import { getHQSessionUser } from "@/lib/headquarters/auth-server";
import { listHQTeamMembers } from "@/lib/hq-team/store";

export default async function UsersPage() {
  const user = await getHQSessionUser();
  if (!user) redirect("/headquarters/login");

  const members = await listHQTeamMembers();
  const users = members.map((member) => ({
    email: member.email,
    name: member.name,
    setvaId: member.setvaId,
    status: member.status,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  }));

  return <UsersView users={users} currentUser={user} />;
}
