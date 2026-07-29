import { CartIcon, HomeIcon, OrdersIcon, LedgerIcon, GridIcon } from "@/components/customer/icons";

export interface CustomerNavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  cartBadge?: boolean;
}

// Single source of truth for the 5-tab customer nav, consumed by both the
// mobile bottom bar and the desktop sidebar so they never drift apart.
// Account is intentionally not a tab here — it's reached via the profile
// avatar in the page header, per the latest wireframe.
export const CUSTOMER_NAV_ITEMS: CustomerNavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/products", label: "Product", icon: GridIcon },
  { href: "/orders", label: "Orders", icon: OrdersIcon },
  { href: "/dues", label: "Ledger", icon: LedgerIcon },
  { href: "/cart", label: "Cart", icon: CartIcon, cartBadge: true },
];
