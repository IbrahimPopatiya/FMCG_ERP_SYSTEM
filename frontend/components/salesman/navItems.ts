import { CartIcon, HomeIcon, OrdersIcon, GridIcon, AccountIcon } from "@/components/customer/icons";
import type { CustomerNavItem } from "@/components/customer/navItems";

// Salesman storefront nav - same 3-tab shape as the customer app, pointed at
// /salesman/* routes instead. Kept as its own list (not reused from the
// customer one) so the customer nav can change independently.
export const SALESMAN_NAV_ITEMS: CustomerNavItem[] = [
  { href: "/salesman/home", label: "Home", icon: HomeIcon },
  { href: "/salesman/products", label: "Products", icon: GridIcon },
  { href: "/salesman/cart", label: "Bag", icon: CartIcon, cartBadge: true },
];

export const SALESMAN_MENU_ITEMS: CustomerNavItem[] = [
  { href: "/salesman/orders", label: "Orders", icon: OrdersIcon },
  { href: "/salesman/account", label: "Account", icon: AccountIcon },
];
