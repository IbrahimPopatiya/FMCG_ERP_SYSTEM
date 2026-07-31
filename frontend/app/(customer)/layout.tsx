"use client";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { CustomerDesktopSidebar } from "@/components/customer/CustomerShell";
import { CustomerMenuProvider, MenuButton } from "@/components/customer/CustomerMenu";
import { AccountAvatar } from "@/components/customer/AccountAvatar";
import { CUSTOMER_NAV_ITEMS } from "@/components/customer/navItems";

// Mobile-first shell for shopkeepers: bottom nav on phones, a persistent
// left sidebar on desktop — both driven by the same CUSTOMER_NAV_ITEMS list.
// The Zaid Traders top bar lives here so every storefront screen shares it.
function CustomerMobileNav() {
  const { totalQty } = useCart();
  const items = CUSTOMER_NAV_ITEMS.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
    badge: item.cartBadge ? totalQty : undefined,
  }));
  return (
    <MobileBottomNav
      items={items}
      variant="island"
      className="border-border/60 bg-white/80 text-ink-muted"
    />
  );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {/* customer-theme must wrap the menu drawer too — CustomerMenuProvider
          renders the slide-out as a sibling of its children, so if the theme
          class sits inside the provider the drawer falls back to root blue. */}
      <div className="customer-theme flex flex-1 overflow-hidden bg-background">
        <CustomerMenuProvider>
          <CustomerDesktopSidebar />
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <AppTopBar title="Zaid Traders" leading={<MenuButton />} trailing={<AccountAvatar />} />
            <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
            <CustomerMobileNav />
          </div>
        </CustomerMenuProvider>
      </div>
    </CartProvider>
  );
}
