import {
  DashboardIcon,
  SalesOrdersIcon,
  PurchaseIcon,
  PaymentsIcon,
  CashBankIcon,
  VehicleIcon,
  InventoryIcon,
  UsersIcon,
  LedgerIcon,
  MoreIcon,
} from "@/components/admin/icons";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

// Desktop sidebar, in the numbered workflow order from
// final_docs/design-prompt/FMCG_Admin_Dashboard_Prompt.md /
// final_docs/images/admin design workflow.png.
export const ADMIN_DESKTOP_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/orders", label: "Sales Orders", icon: SalesOrdersIcon },
  { href: "/admin/suppliers", label: "Purchases", icon: PurchaseIcon },
  { href: "/admin/payments", label: "Payments", icon: PaymentsIcon },
  { href: "/admin/cash-bank", label: "Cash & Bank", icon: CashBankIcon },
  { href: "/admin/vehicles", label: "Vehicles", icon: VehicleIcon },
  { href: "/admin/inventory", label: "Inventory", icon: InventoryIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/ledger", label: "Ledger", icon: LedgerIcon },
];

// 5-slot bottom nav: Dashboard | Sales Orders | + (FAB -> quick actions) |
// Payments | More. Purchases, Cash & Bank, Vehicles, Inventory, Users,
// Ledger and everything else live behind "More" on mobile.
export const ADMIN_MOBILE_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Home", icon: DashboardIcon },
  { href: "/admin/orders", label: "Orders", icon: SalesOrdersIcon },
  { href: "/admin/payments", label: "Payments", icon: PaymentsIcon },
  { href: "/admin/more", label: "More", icon: MoreIcon },
];

export const ADMIN_MORE_LINKS: { href: string; label: string; hint: string; icon: AdminNavItem["icon"] }[] = [
  { href: "/admin/suppliers", label: "Purchases", hint: "Supplier orders & returns", icon: PurchaseIcon },
  { href: "/admin/cash-bank", label: "Cash & Bank", hint: "Cash, UPI & cheque totals", icon: CashBankIcon },
  { href: "/admin/vehicles", label: "Vehicles", hint: "Fleet & trips", icon: VehicleIcon },
  { href: "/admin/inventory", label: "Inventory", hint: "Stock & expiry", icon: InventoryIcon },
  { href: "/admin/products", label: "Products", hint: "Catalog management", icon: InventoryIcon },
  { href: "/admin/users", label: "Users", hint: "Staff accounts", icon: UsersIcon },
  { href: "/admin/ledger", label: "Ledger", hint: "Customer outstanding", icon: LedgerIcon },
  { href: "/admin/customers", label: "Customers", hint: "Accounts & credit", icon: UsersIcon },
  { href: "/admin/deliveries", label: "Deliveries", hint: "Track dispatch", icon: VehicleIcon },
  { href: "/admin/invoices", label: "Invoices", hint: "Billing records", icon: LedgerIcon },
  { href: "/admin/returns", label: "Returns", hint: "Customer returns", icon: PurchaseIcon },
  { href: "/admin/credit-notes", label: "Credit Notes", hint: "Adjustments", icon: LedgerIcon },
  { href: "/admin/categories", label: "Categories", hint: "Catalog structure", icon: InventoryIcon },
  { href: "/admin/brands", label: "Brands", hint: "Catalog structure", icon: InventoryIcon },
  { href: "/admin/price-lists", label: "Price Lists", hint: "Customer pricing", icon: PaymentsIcon },
  { href: "/admin/warehouses", label: "Warehouses", hint: "Storage locations", icon: InventoryIcon },
  { href: "/admin/routes", label: "Routes", hint: "Delivery routes", icon: VehicleIcon },
];
