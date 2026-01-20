import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token.needsConsent && req.nextUrl.pathname !== "/consent") {
    return NextResponse.redirect(new URL("/consent", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/orgs/:path*", "/settings"],
};
