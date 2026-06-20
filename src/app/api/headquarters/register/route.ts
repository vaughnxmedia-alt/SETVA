import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Open registration is disabled. Request access at /headquarters/request-access instead.",
    },
    { status: 403 },
  );
}
