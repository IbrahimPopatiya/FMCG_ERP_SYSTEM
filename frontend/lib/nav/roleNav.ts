import type { UserRole } from "@/types/users";

export interface NavItem {
  href: string;
  label: string;
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
const ADMIN_DESKTOP: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/price-lists", label: "Price Lists" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/routes", label: "Routes" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/deliveries", label: "Deliveries" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/purchases", label: "Purchases" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/credit-notes", label: "Credit Notes" },
];

export const ROLE_NAV: Record<UserRole, RoleNav> = {
  admin: {
    home: "/admin/dashboard",
    desktop: ADMIN_DESKTOP,
    mobile: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/deliveries", label: "Deliveries" },
      { href: "/admin/products", label: "Products" },
      { href: "/admin/customers", label: "Customers" },
    ],
  },
  salesman: {
    home: "/admin/dashboard",
    desktop: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/products", label: "Products" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/credit-notes", label: "Credit Notes" },
    ],
    mobile: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/products", label: "Products" },
    ],
  },
  driver: {
    home: "/admin/deliveries",
    desktop: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/deliveries", label: "Deliveries" },
      { href: "/admin/payments", label: "Payments" },
      { href: "/admin/vehicles", label: "Vehicle" },
    ],
    mobile: [
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
    home: "/admin/orders",
    desktop: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/deliveries", label: "Deliveries" },
      { href: "/admin/vehicles", label: "Vehicles" },
      { href: "/admin/routes", label: "Routes" },
    ],
    mobile: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/deliveries", label: "Deliveries" },
      { href: "/admin/vehicles", label: "Vehicles" },
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
