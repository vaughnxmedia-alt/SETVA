import { redirect } from "next/navigation";

export default function HeadquartersRegisterRedirectPage() {
  redirect("/headquarters/request-access");
}
