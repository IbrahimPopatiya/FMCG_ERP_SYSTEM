import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` — same job: run before a
// request completes and redirect based on session state. This is the ONLY
// place auth redirects happen; pages assume they're already authorized.

const CUSTOMER_HOME = "/home";
const STAFF_HOME = "/admin/dashboard";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("dms_token")?.value;
  const principalType = request.cookies.get("dms_role")?.value;
  const { pathname } = request.nextUrl;

  const isLoginRoute = pathname.startsWith("/login");
  const isRoot = pathname === "/";
  const isStaffRoute = pathname.startsWith("/admin");
  const isCustomerOnlyRoute =
    pathname.startsWith("/cart") || pathname.startsWith("/account");

  if (!token && !isLoginRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // "/" itself renders nothing (app/page.tsx returns null) - it only exists
  // as the PWA's start_url. An unauthenticated visit already gets redirected
  // to /login by the rule above; this covers the authenticated case, which
  // otherwise falls through to a blank page every time the installed app is
  // relaunched while already logged in.
  if (token && (isLoginRoute || isRoot)) {
    return NextResponse.redirect(
      new URL(principalType === "customer" ? CUSTOMER_HOME : STAFF_HOME, request.url)
    );
  }

  if (token && principalType === "customer" && isStaffRoute) {
    return NextResponse.redirect(new URL(CUSTOMER_HOME, request.url));
  }

  if (token && principalType !== "customer" && isCustomerOnlyRoute) {
    return NextResponse.redirect(new URL(STAFF_HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything under /public (logos, icons, manifest, ...) is a static
    // file served by name, not a route - none of it should hit the auth
    // redirect. This matters beyond just "don't 404 on assets": Next's image
    // optimizer fetches local images via an internal, cookie-less request,
    // so an unexcluded asset silently gets redirected to /login and renders
    // as a broken image instead of failing loudly.
    "/((?!api|_next/static|_next/image|.*\\.(?:ico|js|png|jpg|jpeg|svg|webp|webmanifest)$).*)",
  ],
};
