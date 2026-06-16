import { NextRequest, NextResponse } from "next/server";
import { sendSponsorDeckEmail } from "@/lib/email";
import { sponsorDeckDownloadUrl, siteUrl } from "@/lib/sponsor-deck";

type SponsorDeckBody = {
  name?: string;
  email?: string;
  company?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(req: NextRequest) {
  let body: SponsorDeckBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = normalizeText(body.name, 120);
  const email = normalizeText(body.email, 254).toLowerCase();
  const company = normalizeText(body.company, 160);

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!email || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required" },
      { status: 400 },
    );
  }

  const downloadUrl = sponsorDeckDownloadUrl(siteUrl());

  try {
    await sendSponsorDeckEmail({ name, email, company: company || undefined });
  } catch (e) {
    console.error("Sponsor deck email error:", e);
    return NextResponse.json(
      { error: "Could not send the sponsorship deck email" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    downloadUrl,
    demo: !process.env.RESEND_API_KEY?.trim(),
  });
}
