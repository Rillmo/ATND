import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getSupabaseAdmin } from "@/lib/supabase";

const publicPaths = new Set([
  "/",
  "/login",
  "/signup",
  "/consent",
  "/privacy",
  "/terms",
  "/verify",
]);

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (
    publicPaths.has(pathname) ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (token.needsConsent) {
    if (!token.userId) {
      return NextResponse.next();
    }

    const supabase = getSupabaseAdmin();
    const { data: consent } = await supabase
      .from("users")
      .select("privacy_accepted_at, terms_accepted_at")
      .eq("id", token.userId)
      .single();

    const hasConsent = Boolean(
      consent?.privacy_accepted_at && consent?.terms_accepted_at
    );

    if (
      !hasConsent &&
      pathname !== "/consent" &&
      !pathname.startsWith("/api/consent")
    ) {
      const consentUrl = new URL("/consent", req.url);
      consentUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(consentUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/orgs/:path*", "/settings"],
};
