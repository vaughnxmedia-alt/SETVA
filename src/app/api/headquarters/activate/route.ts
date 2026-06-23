import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Use /api/headquarters/register to create an account." },
    { status: 410 },
  );
}
