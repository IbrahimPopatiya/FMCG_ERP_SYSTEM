"use client";

import { useState } from "react";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SalesmanMobileNav } from "@/components/salesman/SalesmanMobileNav";
import { SALESMAN_DESKTOP_NAV_ITEMS } from "@/components/salesman/navItems";
import { CartProvider } from "@/components/salesman/CartContext";
import { getStaffRole } from "@/lib/auth/session";
import { getRoleNav, ROLE_NAV } from "@/lib/nav/roleNav";

// Nav items are role-scoped (see lib/nav/roleNav.ts) - each role sees only
// the domains listed for them in final_docs/role_based_frontend_plan.md §5.
// Falls back to the admin's full nav only until the role cookie is readable
// (server render / first paint before hydration) - useRoleGuard on each page
// is the real gate, this is just what's shown while that resolves.
//
// Salesman gets its own green Material 3 look (see .salesman-theme in
// globals.css) and a FAB-style bottom nav (Take Order), matching
// final_docs/design-prompt/salesman_workflow.md — every other role stays on
// the shared theme.
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [role] = useState(() => getStaffRole());

  const isSalesman = role === "salesman";
  const nav = role ? getRoleNav(role) : ROLE_NAV.admin;

  const body = (
    <div className={`flex flex-1 overflow-hidden ${isSalesman ? "salesman-theme" : ""}`}>
      <DesktopSidebar items={isSalesman ? SALESMAN_DESKTOP_NAV_ITEMS : nav.desktop} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        {isSalesman ? <SalesmanMobileNav /> : <MobileBottomNav items={nav.mobile} />}
      </div>
    </div>
  );

  return isSalesman ? <CartProvider>{body}</CartProvider> : body;
}
