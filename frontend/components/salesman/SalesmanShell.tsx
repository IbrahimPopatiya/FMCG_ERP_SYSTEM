"use client";

import { SALESMAN_NAV_ITEMS, SALESMAN_MENU_ITEMS } from "@/components/salesman/navItems";
import { DesktopSidebar } from "@/components/shared/DesktopSidebar";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

// Desktop sidebar for the salesman storefront - mirrors CustomerDesktopSidebar.
export function SalesmanDesktopSidebar() {
  const user = useCurrentUser();

  return (
    <DesktopSidebar
      navItems={SALESMAN_NAV_ITEMS}
      menuItems={SALESMAN_MENU_ITEMS}
      accountHref="/salesman/account"
      cartHref="/salesman/cart"
      avatarLetter={user.data?.full_name.charAt(0).toUpperCase() ?? "S"}
      profileTitle={user.data?.full_name ?? "Salesman"}
      profileSubtitle="Order entry"
    />
  );
}
