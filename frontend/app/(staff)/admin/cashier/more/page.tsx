"use client";

import Link from "next/link";
import { CashierTopBar } from "@/components/cashier/CashierTopBar";
import { Card } from "@/components/ui/Card";
import {
  OrdersIcon,
  WalletIcon,
  BellIcon,
  ReceiptIcon,
  ChartIcon,
  UsersIcon,
  ChevronRightIcon,
} from "@/components/cashier/icons";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const MENU = [
  { href: "/admin/cashier/orders", label: "Orders", hint: "Orders & payment status", icon: OrdersIcon },
  { href: "/admin/cashier/party-balance", label: "Party Balance", hint: "Customer outstanding dues", icon: WalletIcon },
  { href: "/admin/cashier/alerts", label: "Alerts", hint: "High pending, returns, bounced", icon: BellIcon },
  { href: "/admin/payments", label: "Payments", hint: "Verify & bounce", icon: ReceiptIcon },
  { href: "/admin/invoices", label: "Invoices", hint: "Payment status", icon: ChartIcon },
  { href: "/admin/customers", label: "Customers", hint: "Accounts & dues", icon: UsersIcon },
];

export default function CashierMorePage() {
  useRoleGuard(["admin", "cashier", "manager"]);

  return (
    <div>
      <CashierTopBar title="More" hideAlerts />

      <div className="p-4 sm:p-6">
        <Card className="flex flex-col divide-y divide-border p-0">
          {MENU.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{item.label}</p>
                  <p className="text-xs text-ink-muted">{item.hint}</p>
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
              </Link>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
