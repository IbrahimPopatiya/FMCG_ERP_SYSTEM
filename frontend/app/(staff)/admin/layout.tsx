"use client";

import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SalesmanMobileNav } from "@/components/salesman/SalesmanMobileNav";
import { SALESMAN_DESKTOP_NAV_ITEMS } from "@/components/salesman/navItems";
import { CartProvider } from "@/components/salesman/CartContext";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { ADMIN_DESKTOP_NAV_ITEMS } from "@/components/admin/navItems";
import { LoadingMobileNav } from "@/components/loading/LoadingMobileNav";
import { LOADING_DESKTOP_NAV_ITEMS } from "@/components/loading/navItems";
import { TripDraftProvider } from "@/components/loading/TripDraftContext";
import { useStaffRole } from "@/lib/hooks/useStaffRole";
import { getRoleNav, ROLE_NAV } from "@/lib/nav/roleNav";

// Nav items are role-scoped (see lib/nav/roleNav.ts) - each role sees only
// the domains listed for them in final_docs/role_based_frontend_plan.md §5.
// Falls back to the admin's full nav only until the role cookie is readable
// (server render / first paint before hydration) - useRoleGuard on each page
// is the real gate, this is just what's shown while that resolves.
//
// Salesman and admin each get their own green Material 3 look (see
// .salesman-theme/.admin-theme in globals.css). Salesman also gets a
// FAB-style bottom nav (Take Order); admin gets a FAB-style bottom nav too
// (Quick Actions) plus a numbered-workflow icon sidebar — see
// components/admin/navItems.tsx and final_docs/design-prompt/
// FMCG_Admin_Dashboard_Prompt.md. Every other role stays on the shared
// (legacy blue) theme.
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const role = useStaffRole();

  const isSalesman = role === "salesman";
  const isAdmin = role === "admin";
  const isDispatcher = role === "dispatcher";
  const nav = role ? getRoleNav(role) : ROLE_NAV.admin;
  const themeClass = isSalesman ? "salesman-theme" : isAdmin || isDispatcher ? "admin-theme" : "";

  const body = (
    <div className={`flex flex-1 overflow-hidden ${themeClass}`}>
      <DesktopSidebar
        items={
          isSalesman
            ? SALESMAN_DESKTOP_NAV_ITEMS
            : isAdmin
              ? ADMIN_DESKTOP_NAV_ITEMS
              : isDispatcher
                ? LOADING_DESKTOP_NAV_ITEMS
                : nav.desktop
        }
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        {isSalesman ? (
          <SalesmanMobileNav />
        ) : isAdmin ? (
          <AdminMobileNav />
        ) : isDispatcher ? (
          <LoadingMobileNav />
        ) : (
          <MobileBottomNav items={nav.mobile} />
        )}
      </div>
    </div>
  );

  // Always wrapped (not gated on role) - the role cookie can't be read
  // during the server render pass, so a role-conditional wrap here would
  // make the server and client disagree about whether CartProvider/
  // TripDraftProvider are present, throwing "must be used within Provider"
  // on any direct/hard navigation to a page that calls useCart/useTripDraft.
  return (
    <CartProvider>
      <TripDraftProvider>{body}</TripDraftProvider>
    </CartProvider>
  );
}
