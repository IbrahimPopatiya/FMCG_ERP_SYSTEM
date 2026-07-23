import { HomeIcon, TruckIcon, ChartIcon, MoreIcon } from "@/components/cashier/icons";

export interface CashierNavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

// 5-slot bottom nav matching final_docs/images/cashier design workflow.png:
// Home | Collection | + (FAB) | Reports | More. Party Balance, Alerts,
// Payments, Invoices and Customers live behind "More".
export const CASHIER_NAV_ITEMS: CashierNavItem[] = [
  { href: "/admin/cashier/dashboard", label: "Home", icon: HomeIcon },
  { href: "/admin/cashier/driver-collections", label: "Collection", icon: TruckIcon },
  { href: "/admin/cashier/reports", label: "Reports", icon: ChartIcon },
  { href: "/admin/cashier/more", label: "More", icon: MoreIcon },
];

export const CASHIER_DESKTOP_NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/admin/cashier/dashboard", label: "Dashboard" },
  { href: "/admin/cashier/orders", label: "Orders" },
  { href: "/admin/cashier/driver-collections", label: "Driver Collections" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/cashier/party-balance", label: "Party Balance" },
  { href: "/admin/cashier/alerts", label: "Alerts" },
  { href: "/admin/cashier/expense", label: "Expense Entry" },
  { href: "/admin/cashier/reports", label: "Reports" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/customers", label: "Customers" },
];
