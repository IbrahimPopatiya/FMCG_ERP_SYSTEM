import { CartIcon, HomeIcon, OrdersIcon, LedgerIcon, GridIcon, AccountIcon } from "@/components/customer/icons";

export interface CustomerNavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  cartBadge?: boolean;
}

// Primary 3-tab customer nav (Home, Products, Cart), consumed by both the
// mobile bottom bar and the desktop sidebar so they never drift apart.
export const CUSTOMER_NAV_ITEMS: CustomerNavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/products", label: "Products", icon: GridIcon },
  { href: "/cart", label: "Bag", icon: CartIcon, cartBadge: true },
];

// Secondary items, reached via the hamburger menu drawer on mobile and a
// secondary list on the desktop sidebar — kept out of the primary 3-tab nav.
export const CUSTOMER_MENU_ITEMS: CustomerNavItem[] = [
  { href: "/orders", label: "Orders", icon: OrdersIcon },
  { href: "/dues", label: "Ledger", icon: LedgerIcon },
  { href: "/account", label: "Account", icon: AccountIcon },
];
