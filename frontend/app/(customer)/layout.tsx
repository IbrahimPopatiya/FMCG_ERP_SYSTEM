"use client";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CartBar } from "@/components/cart/CartBar";
import { CartProvider, useCart } from "@/components/cart/CartProvider";

// Mobile-first shell for shopkeepers: no dashboard, just the bottom nav for
// the things a customer needs — home, browse, cart, order status, account.
function CustomerNav() {
  const { totalQty } = useCart();
  const items = [
    { href: "/home", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/cart", label: "Cart", badge: totalQty },
    { href: "/orders", label: "Orders" },
    { href: "/account", label: "Account" },
  ];
  return <MobileBottomNav items={items} />;
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        <CartBar />
        <CustomerNav />
      </div>
    </CartProvider>
  );
}
