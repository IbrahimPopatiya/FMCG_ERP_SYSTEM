"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOADING_NAV_ITEMS } from "@/components/loading/navItems";

// Flat bottom nav, no FAB — the Loading Supervisor's primary action
// ("Select Orders") lives on the Orders screen itself, not behind a
// quick-create button, per final_docs/images/loading design workflow.png.
export function LoadingMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 border-t border-border bg-white sm:hidden">
      {LOADING_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              active ? "text-primary" : "text-ink-muted/70"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
