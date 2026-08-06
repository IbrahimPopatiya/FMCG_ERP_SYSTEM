"use client";

import { CUSTOMER_NAV_ITEMS, CUSTOMER_MENU_ITEMS } from "@/components/customer/navItems";
import { DesktopSidebar } from "@/components/shared/DesktopSidebar";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";

// Persistent left sidebar shown at md+ widths, replacing the mobile bottom
// bar. Customers on desktop get the same 5 sections plus a "deliver to" +
// cart summary permanently visible, instead of hunting through a phone-style
// tab bar stretched across a wide screen.
export function CustomerDesktopSidebar() {
  const customer = useCurrentCustomer();

  return (
    <DesktopSidebar
      navItems={CUSTOMER_NAV_ITEMS}
      menuItems={CUSTOMER_MENU_ITEMS}
      accountHref="/account"
      cartHref="/cart"
      avatarLetter={customer.data?.business_name.charAt(0).toUpperCase() ?? "S"}
      profileTitle={customer.data?.business_name ?? "Your store"}
      profileSubtitle={customer.data ? `${customer.data.city}, ${customer.data.state}` : "Wholesale ordering"}
    />
  );
}
