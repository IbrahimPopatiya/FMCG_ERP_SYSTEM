"use client";

import { useState } from "react";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { getStaffRole } from "@/lib/auth/session";
import { getRoleNav, ROLE_NAV } from "@/lib/nav/roleNav";

// Nav items are role-scoped (see lib/nav/roleNav.ts) - each role sees only
// the domains listed for them in final_docs/role_based_frontend_plan.md §5.
// Falls back to the admin's full nav only until the role cookie is readable
// (server render / first paint before hydration) - useRoleGuard on each page
// is the real gate, this is just what's shown while that resolves.
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [role] = useState(() => getStaffRole());

  const nav = role ? getRoleNav(role) : ROLE_NAV.admin;

  return (
    <div className="flex flex-1 overflow-hidden">
      <DesktopSidebar items={nav.desktop} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        <MobileBottomNav items={nav.mobile} />
      </div>
    </div>
  );
}
