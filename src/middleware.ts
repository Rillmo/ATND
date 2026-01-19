import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token) {
        return false;
      }

      if (token.needsConsent && req.nextUrl.pathname !== "/consent") {
        return NextResponse.redirect(
          new URL("/consent", req.nextUrl.origin).toString()
        );
      }

      return true;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/orgs/:path*"],
};
