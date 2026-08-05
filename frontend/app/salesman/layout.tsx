"use client";

import { usePathname } from "next/navigation";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { SelectedCustomerProvider } from "@/components/salesman/SelectedCustomerProvider";
import { SalesmanDesktopSidebar } from "@/components/salesman/SalesmanShell";
import { SalesmanMenuProvider, SalesmanMenuButton } from "@/components/salesman/SalesmanMenu";
import { SALESMAN_NAV_ITEMS } from "@/components/salesman/navItems";
import { AccountAvatar } from "@/components/customer/AccountAvatar";
import { HomeSearchProvider, HomeSearchButton } from "@/components/customer/HomeSearch";
import { Logo } from "@/components/ui/Logo";
import { BRAND } from "@/lib/branding";

// Storefront-style shell for salesmen placing orders on a customer's behalf
// - same shape as the customer layout (bottom nav on phones, sidebar on
// desktop) but wired to /salesman/* routes and its own selected-customer
// context instead of a logged-in customer's own account.
function SalesmanMobileNav() {
  const { totalQty } = useCart();
  const items = SALESMAN_NAV_ITEMS.map((item) => ({
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

function SalesmanTopBar() {
  const pathname = usePathname();
  const isHome = pathname === "/salesman/home";

  return (
    <AppTopBar
      title={
        <span className="flex items-center gap-2">
          <Logo className="h-6 w-auto" />
          {!BRAND.logoIncludesName && BRAND.name}
        </span>
      }
      leading={<SalesmanMenuButton />}
      trailing={
        <div className="flex items-center gap-1.5">
          {isHome && <HomeSearchButton />}
          <AccountAvatar href="/salesman/account" />
        </div>
      }
    />
  );
}

export default function SalesmanLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <SelectedCustomerProvider>
        <div className="customer-theme flex flex-1 overflow-hidden bg-background">
          <SalesmanMenuProvider>
            <HomeSearchProvider>
              <SalesmanDesktopSidebar />
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                <SalesmanTopBar />
                <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
                <SalesmanMobileNav />
              </div>
            </HomeSearchProvider>
          </SalesmanMenuProvider>
        </div>
      </SelectedCustomerProvider>
    </CartProvider>
  );
}
