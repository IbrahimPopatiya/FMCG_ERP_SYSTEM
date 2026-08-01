// Small hand-written line icons for the staff/admin screens, matching the
// same inline-SVG convention as components/customer/icons.tsx (no icon
// library dependency). Re-exports the shapes that are already a good fit
// there and adds the handful the admin mockup needs that don't exist yet.
import type { ComponentType } from "react";
import {
  HomeIcon,
  SearchIcon,
  FilterIcon,
  BellIcon,
  ChevronRightIcon,
  BackArrowIcon,
  MenuIcon,
  TrashIcon,
  TruckIcon,
  BoxIcon,
  DocumentIcon,
  GridIcon,
  CartIcon,
  WalletIcon,
} from "@/components/customer/icons";

export {
  HomeIcon,
  SearchIcon,
  FilterIcon,
  BellIcon,
  ChevronRightIcon,
  BackArrowIcon,
  MenuIcon,
  TrashIcon,
  TruckIcon,
  BoxIcon,
  DocumentIcon,
  GridIcon,
  CartIcon,
  WalletIcon,
};

type IconProps = { className?: string };

export function PeopleIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20c.9-3.2 3.4-5 6.5-5s5.6 1.8 6.5 5" strokeLinecap="round" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M15.5 15.3c2.4.4 4 1.9 4.6 4.7" strokeLinecap="round" />
    </svg>
  );
}

export function PersonIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M6.5 3.5h2.7l1.3 4-2 1.4a10 10 0 004.6 4.6l1.4-2 4 1.3v2.7a1.5 1.5 0 01-1.6 1.5A15.5 15.5 0 015 5.1a1.5 1.5 0 011.5-1.6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PinIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s-6.5-5.9-6.5-11A6.5 6.5 0 0112 3.5a6.5 6.5 0 016.5 6.5c0 5.1-6.5 11-6.5 11z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

export function PencilIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16.5 3.5l4 4L7 21H3v-4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function UploadCloudIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 18a4.5 4.5 0 01-.6-8.96A5.5 5.5 0 0117 8.5a4 4 0 010 8H7z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11v6m0-6l-2.3 2.3M12 11l2.3 2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Bottom-nav / sidebar icon per admin section, keyed by href so both
// MobileBottomNav and DesktopSidebar can look one up without every caller
// of getRoleNav() having to carry an icon component around.
export const NAV_ICON_BY_HREF: Record<string, ComponentType<IconProps>> = {
  "/admin/dashboard": HomeIcon,
  "/admin/orders": CartIcon,
  "/admin/customers": PeopleIcon,
  "/admin/products": GridIcon,
  "/admin/deliveries": TruckIcon,
  "/admin/payments": WalletIcon,
  "/admin/invoices": DocumentIcon,
  "/admin/credit-notes": DocumentIcon,
  "/admin/vehicles": TruckIcon,
};
