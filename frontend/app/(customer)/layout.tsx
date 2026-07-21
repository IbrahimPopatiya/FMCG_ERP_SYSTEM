import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

// Mobile-first shell for shopkeepers: no dashboard, just the bottom nav for
// the four things a customer needs — browse, cart, order status, account.
const NAV_ITEMS = [
  { href: "/products", label: "Products" },
  { href: "/cart", label: "Cart" },
  { href: "/orders", label: "Orders" },
  { href: "/account", label: "Account" },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <main className="flex-1 pb-16">{children}</main>
      <MobileBottomNav items={NAV_ITEMS} />
    </div>
  );
}
