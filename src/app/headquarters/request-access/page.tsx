import { redirect } from "next/navigation";

export default function HeadquartersRequestAccessRedirectPage() {
  redirect("/headquarters/register");
}
