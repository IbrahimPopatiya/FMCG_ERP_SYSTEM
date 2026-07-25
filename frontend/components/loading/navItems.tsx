import { DashboardIcon, SalesOrdersIcon, VehicleIcon, UsersIcon } from "@/components/admin/icons";

export interface LoadingNavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

// Flat 4-icon bottom nav (no FAB), matching final_docs/images/loading design
// workflow.png: Home | Orders | Trips | Profile.
export const LOADING_NAV_ITEMS: LoadingNavItem[] = [
  { href: "/admin/loading/dashboard", label: "Home", icon: DashboardIcon },
  { href: "/admin/loading/orders", label: "Orders", icon: SalesOrdersIcon },
  { href: "/admin/loading/trips", label: "Trips", icon: VehicleIcon },
  { href: "/admin/loading/profile", label: "Profile", icon: UsersIcon },
];

export const LOADING_DESKTOP_NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/admin/loading/dashboard", label: "Dashboard" },
  { href: "/admin/loading/orders", label: "Orders (LC)" },
  { href: "/admin/loading/trips", label: "Trips" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/deliveries", label: "Deliveries" },
];
