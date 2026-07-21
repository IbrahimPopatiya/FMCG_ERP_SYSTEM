import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

// Sidebar on desktop (full nav across every staff domain), simplified bottom
// nav on mobile (just the most frequent actions — dashboard is hidden here,
// per the UI/UX brief).
const DESKTOP_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/deliveries", label: "Deliveries" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/purchases", label: "Purchases" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/users", label: "Users" },
];

const MOBILE_NAV_ITEMS = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/deliveries", label: "Deliveries" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/customers", label: "Customers" },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <DesktopSidebar items={DESKTOP_NAV_ITEMS} />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>
        <MobileBottomNav items={MOBILE_NAV_ITEMS} />
      </div>
    </div>
  );
}
