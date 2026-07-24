"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Card } from "@/components/ui/Card";
import {
  UsersIcon,
  OrdersIcon,
  WalletIcon,
  ChartIcon,
  BoxIcon,
  ChevronRightIcon,
  LogoutIcon,
} from "@/components/salesman/icons";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { clearSession } from "@/lib/auth/session";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const MENU_ITEMS = [
  { href: "/admin/salesman/customers", label: "Customers", icon: UsersIcon },
  { href: "/admin/salesman/orders", label: "Orders", icon: OrdersIcon },
  { href: "/admin/payments", label: "Payments", icon: WalletIcon },
  { href: "/admin/salesman/reports", label: "Reports", icon: ChartIcon },
  { href: "/admin/inventory", label: "Stock", icon: BoxIcon },
];

export default function SalesmanMorePage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/login");
  }

  return (
    <div>
      <SalesmanTopBar title="More" hideAlerts />

      <div className="flex flex-col gap-4 p-4 pb-8 sm:p-6">
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
            {currentUser.data?.full_name?.charAt(0).toUpperCase() ?? "S"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{currentUser.data?.full_name ?? "Salesman"}</p>
            <p className="truncate text-xs text-ink-muted">{currentUser.data?.mobile}</p>
          </div>
        </Card>

        <Card className="flex flex-col divide-y divide-border p-0">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm font-medium text-ink">{item.label}</span>
                <ChevronRightIcon className="h-4 w-4 text-ink-muted" />
              </Link>
            );
          })}
        </Card>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-semibold text-danger"
        >
          <LogoutIcon className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
