"use client";

import { useMemo } from "react";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { usePaymentsManage } from "@/lib/hooks/usePayments";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

// Cash & Bank is derived entirely from recorded customer payments — there is
// no ledger/opening-balance/bank-deposit tracking in the backend, so this
// page only ever shows numbers that come from real records (cash/UPI/cheque
// received). Opening cash, bank deposits and closing cash from the design
// mock are intentionally omitted rather than fabricated.
export default function CashBankPage() {
  useRoleGuard(["admin", "manager", "cashier"]);

  const payments = usePaymentsManage();
  const allPayments = payments.data?.pages.flatMap((p) => p.items) ?? [];

  const totals = useMemo(() => {
    return allPayments.reduce(
      (acc, p) => {
        acc.cash += p.cash_amount;
        acc.upi += p.upi_amount;
        acc.cheque += p.cheque_amount;
        acc.total += p.total_amount;
        return acc;
      },
      { cash: 0, upi: 0, cheque: 0, total: 0 }
    );
  }, [allPayments]);

  const byDay = useMemo(() => {
    const map = new Map<string, { cash: number; upi: number; cheque: number; total: number; count: number }>();
    for (const p of allPayments) {
      const key = formatDate(p.payment_date);
      const entry = map.get(key) ?? { cash: 0, upi: 0, cheque: 0, total: 0, count: 0 };
      entry.cash += p.cash_amount;
      entry.upi += p.upi_amount;
      entry.cheque += p.cheque_amount;
      entry.total += p.total_amount;
      entry.count += 1;
      map.set(key, entry);
    }
    return Array.from(map.entries());
  }, [allPayments]);

  return (
    <div>
      <AdminTopBar title="Cash & Bank" back />

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard label="Cash received" value={formatCurrency(totals.cash)} isLoading={payments.isLoading} />
          <StatCard label="UPI received" value={formatCurrency(totals.upi)} isLoading={payments.isLoading} />
          <StatCard label="Cheques received" value={formatCurrency(totals.cheque)} isLoading={payments.isLoading} />
          <StatCard label="Total received" value={formatCurrency(totals.total)} isLoading={payments.isLoading} tone="success" />
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-ink">Daily breakdown</h2>
          {payments.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : byDay.length === 0 ? (
            <Card className="rounded-2xl text-center text-sm text-ink-muted">No payments recorded yet.</Card>
          ) : (
            <div className="flex flex-col gap-2">
              {byDay.map(([date, entry]) => (
                <Card key={date} className="rounded-2xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">{date}</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(entry.total)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
                    <span>Cash {formatCurrency(entry.cash)}</span>
                    <span>UPI {formatCurrency(entry.upi)}</span>
                    <span>Cheque {formatCurrency(entry.cheque)}</span>
                    <span>{entry.count} payment{entry.count === 1 ? "" : "s"}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
