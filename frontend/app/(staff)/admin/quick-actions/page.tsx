"use client";

import Link from "next/link";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, PurchaseIcon, PaymentsIcon, VehicleIcon } from "@/components/admin/icons";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const ACTIONS = [
  { href: "/admin/suppliers", label: "New Purchase", hint: "Order stock from a supplier", icon: PurchaseIcon },
  { href: "/admin/payments", label: "Record Payment", hint: "Log a cash, UPI or cheque receipt", icon: PaymentsIcon },
  { href: "/admin/vehicles", label: "Add Vehicle", hint: "Register a new fleet vehicle", icon: VehicleIcon },
];

export default function QuickActionsPage() {
  useRoleGuard(["admin", "manager"]);

  return (
    <div className="sm:hidden">
      <AdminTopBar title="Quick Actions" back />
      <div className="flex flex-col gap-2 p-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="flex items-center gap-3 rounded-2xl">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{action.label}</p>
                  <p className="text-xs text-ink-muted">{action.hint}</p>
                </div>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
