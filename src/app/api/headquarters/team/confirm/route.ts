import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/sponsor-deck";

export async function GET() {
  return NextResponse.redirect(`${siteUrl()}/headquarters/register`);
}
