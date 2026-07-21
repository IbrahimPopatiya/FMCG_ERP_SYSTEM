import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` — same job: run before a
// request completes and redirect based on session state. This is the ONLY
// place auth redirects happen; pages assume they're already authorized.

const CUSTOMER_HOME = "/products";
const STAFF_HOME = "/admin/dashboard";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("dms_token")?.value;
  const principalType = request.cookies.get("dms_role")?.value;
  const { pathname } = request.nextUrl;

  const isLoginRoute = pathname.startsWith("/login");
  const isStaffRoute = pathname.startsWith("/admin");
  const isCustomerOnlyRoute =
    pathname.startsWith("/cart") || pathname.startsWith("/account");

  if (!token && !isLoginRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isLoginRoute) {
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
