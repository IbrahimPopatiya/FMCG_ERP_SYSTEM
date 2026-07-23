"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { CashierTopBar } from "@/components/cashier/CashierTopBar";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertTriangleIcon } from "@/components/cashier/icons";
import { getCustomerDues } from "@/lib/api/customers";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { useDriverCollections } from "@/lib/hooks/useDriverCollections";
import { useCashierPaymentsSample, useCashierReturnsSample } from "@/lib/hooks/useCashierCollections";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const HIGH_PENDING_SAMPLE_SIZE = 40;

function daysAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export default function CashierAlertsPage() {
  useRoleGuard(["admin", "cashier", "manager"]);

  const customers = useCustomerDirectorySample();
  const { rows: driverRows, isLoading: driversLoading } = useDriverCollections();
  const payments = useCashierPaymentsSample();
  const returns = useCashierReturnsSample();

  // Bounded sample, same reasoning as useCustomerDirectorySample - good
  // enough to surface the worst offenders, not a full ledger sweep.
  const sample = (customers.data?.items ?? []).slice(0, HIGH_PENDING_SAMPLE_SIZE);
  const duesQueries = useQueries({
    queries: sample.map((customer) => ({
      queryKey: ["customers", customer.id, "dues"],
      queryFn: () => getCustomerDues(customer.id),
      staleTime: 60 * 1000,
    })),
  });

  const highPending = useMemo(() => {
    return sample
      .map((customer, i) => {
        const dues = duesQueries[i]?.data;
        const oldestInvoice = dues?.invoices.reduce<string | null>((oldest, inv) => {
          if (!oldest || new Date(inv.invoice_date) < new Date(oldest)) return inv.invoice_date;
          return oldest;
        }, null);
        return {
          customer,
          totalDue: dues?.total_due ?? 0,
          daysOverdue: oldestInvoice ? daysAgo(oldestInvoice) : 0,
        };
      })
      .filter((row) => row.totalDue > 0)
      .sort((a, b) => b.totalDue - a.totalDue)
      .slice(0, 6);
  }, [sample, duesQueries]);

  const duesLoading = duesQueries.some((q) => q.isLoading);
  const pendingDrivers = driverRows.filter((r) => r.pending > 0);
  const recentReturns = (returns.data?.items ?? [])
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const bouncedPayments = (payments.data?.items ?? []).filter((p) => p.status === "bounced").slice(0, 5);

  return (
    <div>
      <CashierTopBar title="Alerts" hideAlerts />

      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">High Pending Payments</h2>
          {duesLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : highPending.length === 0 ? (
            <Card className="text-sm text-ink-muted">No customers with outstanding dues right now.</Card>
          ) : (
            <div className="flex flex-col gap-2">
              {highPending.map(({ customer, totalDue, daysOverdue }) => (
                <Link key={customer.id} href={`/admin/customers/${customer.id}`}>
                  <Card className="flex items-center justify-between gap-3 border-red-100 transition-colors hover:border-red-300">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangleIcon className="h-4.5 w-4.5 shrink-0 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-ink">{customer.business_name}</p>
                        {daysOverdue > 0 && (
                          <p className="text-xs text-ink-muted">Over {daysOverdue} day{daysOverdue === 1 ? "" : "s"}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(totalDue)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Pending Drivers</h2>
          {driversLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : pendingDrivers.length === 0 ? (
            <Card className="text-sm text-ink-muted">Every driver is fully verified today.</Card>
          ) : (
            <div className="flex flex-col gap-2">
              {pendingDrivers.map((row) => (
                <Link key={row.driverId} href={`/admin/cashier/driver-collections/${row.driverId}`}>
                  <Card className="flex items-center justify-between gap-3 transition-colors hover:border-primary/50">
                    <p className="text-sm font-medium text-ink">{row.driverName}</p>
                    <p className="text-sm font-semibold text-amber-600">{formatCurrency(row.pending)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Recent Returns</h2>
          {returns.isLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : recentReturns.length === 0 ? (
            <Card className="text-sm text-ink-muted">No returns recorded yet.</Card>
          ) : (
            <div className="flex flex-col gap-2">
              {recentReturns.map((r) => (
                <Card key={r.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{r.order_number}</p>
                    <p className="text-xs text-ink-muted">{formatDate(r.created_at)}</p>
                  </div>
                  <span className="text-xs font-medium capitalize text-ink-muted">{r.status}</span>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Other Alerts</h2>
          {payments.isLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : bouncedPayments.length === 0 ? (
            <Card className="text-sm text-ink-muted">No bounced payments.</Card>
          ) : (
            <div className="flex flex-col gap-2">
              {bouncedPayments.map((p) => (
                <Link key={p.id} href={`/admin/payments/${p.id}`}>
                  <Card className="flex items-center justify-between gap-3 border-red-100 transition-colors hover:border-red-300">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangleIcon className="h-4.5 w-4.5 shrink-0 text-red-500" />
                      <p className="text-sm font-medium text-ink">{p.invoice_number} bounced</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(p.total_amount)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
