import type { UserRole } from "@/types/users";

export interface NavItem {
  href: string;
  label: string;
  icon?: (props: { className?: string }) => React.ReactElement;
}

interface RoleNav {
  home: string;
  desktop: NavItem[];
  mobile: NavItem[];
}

// Per-role screen sets from final_docs/role_based_frontend_plan.md §5.
// Some hrefs (credit-notes, warehouses, routes, price-lists, brands,
// categories) point at pages that don't exist in the frontend yet - Phase 2
// builds them. This map isn't wired into the staff layout/nav yet - that's
// Phase 3, once every referenced page actually exists.
// Admin's real nav lives in components/admin/navItems.tsx (workflow-ordered,
// with icons + a mobile FAB) and is wired directly in the staff layout, same
// as salesman. This entry is kept as the pre-hydration/fallback nav only.
const ADMIN_DESKTOP: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/orders", label: "Sales Orders" },
  { href: "/admin/suppliers", label: "Purchases" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/cash-bank", label: "Cash & Bank" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/ledger", label: "Ledger" },
];

export const ROLE_NAV: Record<UserRole, RoleNav> = {
  admin: {
    home: "/admin/dashboard",
    desktop: ADMIN_DESKTOP,
    mobile: [
      { href: "/admin/dashboard", label: "Home" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/more", label: "More" },
    ],
  },
  salesman: {
    home: "/admin/salesman/dashboard",
    desktop: [
      { href: "/admin/salesman/dashboard", label: "Dashboard" },
      { href: "/admin/salesman/customers", label: "Customers" },
      { href: "/admin/salesman/take-order", label: "Take Order" },
      { href: "/admin/salesman/orders", label: "Orders" },
      { href: "/admin/salesman/reports", label: "Reports" },
    ],
    mobile: [
      { href: "/admin/salesman/dashboard", label: "Home" },
      { href: "/admin/salesman/customers", label: "Customers" },
      { href: "/admin/salesman/orders", label: "Orders" },
      { href: "/admin/salesman/more", label: "More" },
    ],
  },
  driver: {
    home: "/admin/loading/trips",
    desktop: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/loading/trips", label: "My Trips" },
      { href: "/admin/deliveries", label: "Deliveries" },
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/vehicles", label: "Vehicle" },
    ],
    mobile: [
      { href: "/admin/loading/trips", label: "Trips" },
      { href: "/admin/deliveries", label: "Deliveries" },
      { href: "/admin/payments", label: "Payments" },
    ],
  },
  manager: {
    home: "/admin/dashboard",
    desktop: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/products", label: "Products" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/invoices", label: "Invoices" },
      { href: "/admin/deliveries", label: "Deliveries" },
      { href: "/admin/inventory", label: "Inventory" },
      { href: "/admin/purchases", label: "Purchases" },
      { href: "/admin/suppliers", label: "Suppliers" },
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/returns", label: "Returns" },
      { href: "/admin/vehicles", label: "Vehicles" },
      { href: "/admin/routes", label: "Routes" },
    ],
    mobile: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/deliveries", label: "Deliveries" },
      { href: "/admin/products", label: "Products" },
      { href: "/admin/customers", label: "Customers" },
    ],
  },
  dispatcher: {
    home: "/admin/loading/dashboard",
    desktop: [
      { href: "/admin/loading/dashboard", label: "Dashboard" },
      { href: "/admin/loading/orders", label: "Orders (LC)" },
      { href: "/admin/loading/trips", label: "Trips" },
      { href: "/admin/vehicles", label: "Vehicles" },
      { href: "/admin/deliveries", label: "Deliveries" },
      { href: "/admin/routes", label: "Routes" },
    ],
    mobile: [
      { href: "/admin/loading/dashboard", label: "Home" },
      { href: "/admin/loading/orders", label: "Orders" },
      { href: "/admin/loading/trips", label: "Trips" },
    ],
  },
  cashier: {
    home: "/admin/payments",
    desktop: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/invoices", label: "Invoices" },
      { href: "/admin/customers", label: "Customers" },
    ],
    mobile: [
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/invoices", label: "Invoices" },
    ],
  },
};

export function getRoleNav(role: UserRole): RoleNav {
  return ROLE_NAV[role];
}
