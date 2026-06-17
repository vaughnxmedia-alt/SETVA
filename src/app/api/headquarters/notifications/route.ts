import { NextResponse } from "next/server";
import { getHQNotifications } from "@/lib/headquarters/data";

export async function GET() {
  const notifications = await getHQNotifications();
  return NextResponse.json({ notifications });
}
