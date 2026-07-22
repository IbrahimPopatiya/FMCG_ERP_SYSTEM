"use client";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CartBar } from "@/components/cart/CartBar";
import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { CustomerDesktopSidebar } from "@/components/customer/CustomerShell";
import { CUSTOMER_NAV_ITEMS } from "@/components/customer/navItems";

// Mobile-first shell for shopkeepers: bottom nav on phones, a persistent
// left sidebar on desktop — both driven by the same CUSTOMER_NAV_ITEMS list.
function CustomerMobileNav() {
  const { totalQty } = useCart();
  const items = CUSTOMER_NAV_ITEMS.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
    badge: item.cartBadge ? totalQty : undefined,
  }));
  return <MobileBottomNav items={items} />;
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="customer-theme flex flex-1 overflow-hidden bg-background">
        <CustomerDesktopSidebar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
          <CartBar />
          <CustomerMobileNav />
        </div>
      </div>
    </CartProvider>
  );
}
