import { AccountIcon, CartIcon, GridIcon, HomeIcon, OrdersIcon } from "@/components/customer/icons";

export interface CustomerNavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  cartBadge?: boolean;
}

// Single source of truth for the 5-tab customer nav, consumed by both the
// mobile bottom bar and the desktop sidebar so they never drift apart.
export const CUSTOMER_NAV_ITEMS: CustomerNavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/categories", label: "Categories", icon: GridIcon },
  { href: "/orders", label: "Orders", icon: OrdersIcon },
  { href: "/cart", label: "Cart", icon: CartIcon, cartBadge: true },
  { href: "/account", label: "Account", icon: AccountIcon },
];
