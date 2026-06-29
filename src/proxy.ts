import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_SITE_HOST = "www.setvawards.com";

function isVercelAppHost(host: string): boolean {
  return /\.vercel\.app$/i.test(host.trim());
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  if (isVercelAppHost(hostname)) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.host = CANONICAL_SITE_HOST;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
