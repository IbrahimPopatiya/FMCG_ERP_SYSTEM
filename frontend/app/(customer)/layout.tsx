"use client";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { CustomerDesktopSidebar } from "@/components/customer/CustomerShell";
import { CustomerMenuProvider } from "@/components/customer/CustomerMenu";
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
  return <MobileBottomNav items={items} className="bg-black/95 border-white/10 text-white/50" />;
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CustomerMenuProvider>
        <div className="customer-theme flex flex-1 overflow-hidden bg-background">
          <CustomerDesktopSidebar />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
            <CustomerMobileNav />
          </div>
        </div>
      </CustomerMenuProvider>
    </CartProvider>
  );
}
