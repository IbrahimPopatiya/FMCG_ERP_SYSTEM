"use client";

import Link from "next/link";
import { AccountIcon } from "@/components/customer/icons";

// Profile-icon entry point to /account — the bottom nav no longer carries an
// Account tab (per the latest wireframe), so every storefront header exposes
// this same avatar button in the top-right corner instead.
export function AccountAvatar({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/account"
      aria-label="Account"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary hover:bg-primary hover:text-white ${className}`}
    >
      <AccountIcon className="h-5 w-5" />
    </Link>
  );
}
