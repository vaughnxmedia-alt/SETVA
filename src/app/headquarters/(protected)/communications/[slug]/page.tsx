import { redirect } from "next/navigation";

export default async function CommunicationsWorkflowPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  redirect("/headquarters/sponsors/outreach");
}
