"use client";

import { useState } from "react";
import Link from "next/link";
import { CashierTopBar } from "@/components/cashier/CashierTopBar";
import { CashierDatePicker, CASHIER_TODAY } from "@/components/cashier/CashierDatePicker";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDriverCollections } from "@/lib/hooks/useDriverCollections";
import { formatCurrency } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const TABS = [
  { value: "all", label: "All Drivers" },
  { value: "pending", label: "Pending Only" },
] as const;

export default function DriverCollectionsPage() {
  useRoleGuard(["admin", "cashier", "manager"]);

  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("all");
  const [date, setDate] = useState(CASHIER_TODAY);
  const { rows, isLoading } = useDriverCollections(date);

  const visibleRows = tab === "pending" ? rows.filter((r) => r.pending > 0) : rows;
  const totalCollected = rows.reduce((sum, r) => sum + r.total, 0);
  const totalPending = rows.reduce((sum, r) => sum + r.pending, 0);

  return (
    <div>
      <CashierTopBar title="Driver Collections" />

      <div className="border-b border-border bg-white px-4 pt-3 sm:px-6">
        <div className="pb-3">
          <CashierDatePicker value={date} onChange={setDate} />
        </div>
        <div className="grid grid-cols-3 gap-3 pb-4 text-center">
          <div>
            <p className="text-xs text-ink-muted">Total Collected</p>
            {isLoading ? (
              <Skeleton className="mx-auto mt-1 h-6 w-16" />
            ) : (
              <p className="text-base font-semibold text-ink">{formatCurrency(totalCollected)}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-ink-muted">Pending Amount</p>
            {isLoading ? (
              <Skeleton className="mx-auto mt-1 h-6 w-16" />
            ) : (
              <p className={`text-base font-semibold ${totalPending > 0 ? "text-amber-600" : "text-ink"}`}>
                {formatCurrency(totalPending)}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-ink-muted">Drivers</p>
            <p className="text-base font-semibold text-ink">{rows.length}</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-transparent">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.value ? "border-primary text-primary" : "border-transparent text-ink-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 sm:p-6">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}

        {!isLoading && visibleRows.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <p className="text-sm font-medium text-ink">
              {tab === "pending" ? "No pending collections" : "No drivers found"}
            </p>
            <p className="text-sm text-ink-muted">
              {tab === "pending" ? "Every driver is fully verified on this date." : "Driver accounts will show up here once added."}
            </p>
          </div>
        )}

        {!isLoading &&
          visibleRows.map((row) => (
            <Link key={row.driverId} href={`/admin/cashier/driver-collections/${row.driverId}`}>
              <Card className="flex flex-col gap-3 transition-colors hover:border-primary/50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{row.driverName}</p>
                    <p className="text-xs text-ink-muted">
                      {row.orders} payment{row.orders === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-ink">{formatCurrency(row.total)}</p>
                    {row.pending > 0 ? (
                      <Badge tone="warning">{formatCurrency(row.pending)} pending</Badge>
                    ) : (
                      <Badge tone="success">All cleared</Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-sm">
                  <div>
                    <p className="text-ink-muted">Cash</p>
                    <p className="font-medium text-ink">{formatCurrency(row.cash)}</p>
                  </div>
                  <div>
                    <p className="text-ink-muted">UPI</p>
                    <p className="font-medium text-ink">{formatCurrency(row.upi)}</p>
                  </div>
                  <div>
                    <p className="text-ink-muted">Cheque</p>
                    <p className="font-medium text-ink">{formatCurrency(row.cheque)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}
