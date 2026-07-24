import { HomeIcon, UsersIcon, OrdersIcon, MoreIcon } from "@/components/salesman/icons";

export interface SalesmanNavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

// 5-slot bottom nav matching final_docs/design-prompt/salesman_workflow.md:
// Home | Customers | + (FAB -> Take Order) | Orders | More. Payments,
// Reports, Stock and Settings live behind "More".
export const SALESMAN_NAV_ITEMS: SalesmanNavItem[] = [
  { href: "/admin/salesman/dashboard", label: "Home", icon: HomeIcon },
  { href: "/admin/salesman/customers", label: "Customers", icon: UsersIcon },
  { href: "/admin/salesman/orders", label: "Orders", icon: OrdersIcon },
  { href: "/admin/salesman/more", label: "More", icon: MoreIcon },
];

export const SALESMAN_DESKTOP_NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/admin/salesman/dashboard", label: "Dashboard" },
  { href: "/admin/salesman/customers", label: "Customers" },
  { href: "/admin/salesman/take-order", label: "Take Order" },
  { href: "/admin/salesman/orders", label: "Orders" },
  { href: "/admin/salesman/reports", label: "Reports" },
];
