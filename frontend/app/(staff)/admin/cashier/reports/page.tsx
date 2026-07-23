"use client";

import { useMemo, useState } from "react";
import { CashierTopBar } from "@/components/cashier/CashierTopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCashierPaymentsSample, useCashierReturnsSample } from "@/lib/hooks/useCashierCollections";
import { formatCurrency, isWithinDateRange } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CashierReportsPage() {
  useRoleGuard(["admin", "cashier", "manager"]);

  const today = toDateInput(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const payments = useCashierPaymentsSample();
  const returns = useCashierReturnsSample();

  const filteredPayments = useMemo(
    () => (payments.data?.items ?? []).filter((p) => isWithinDateRange(p.payment_date, from, to)),
    [payments.data, from, to]
  );
  const filteredReturns = useMemo(
    () => (returns.data?.items ?? []).filter((r) => isWithinDateRange(r.created_at, from, to)),
    [returns.data, from, to]
  );

  const cash = filteredPayments.reduce((sum, p) => sum + p.cash_amount, 0);
  const upi = filteredPayments.reduce((sum, p) => sum + p.upi_amount, 0);
  const cheque = filteredPayments.reduce((sum, p) => sum + p.cheque_amount, 0);
  const totalCollection = cash + upi + cheque;
  const pending = filteredPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.total_amount, 0);
  const netCollection = totalCollection - pending;

  const isLoading = payments.isLoading || returns.isLoading;

  function handleExport() {
    downloadCsv(`collection-report-${from}-to-${to}.csv`, [
      ["Invoice", "Customer ID", "Cash", "UPI", "Cheque", "Total", "Status", "Date"],
      ...filteredPayments.map((p) => [
        p.invoice_number,
        p.customer_id,
        p.cash_amount,
        p.upi_amount,
        p.cheque_amount,
        p.total_amount,
        p.status,
        p.payment_date,
      ]),
    ]);
  }

  return (
    <div>
      <CashierTopBar title="Reports" subtitle={`${from} to ${to}`} />

      <header className="flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Collection Report</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Cash, UPI, cheque and returns for the selected range</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">To</label>
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button type="button" variant="secondary" onClick={handleExport} disabled={isLoading}>
            Export CSV
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-6 p-4 sm:p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <p className="text-sm font-medium text-ink-muted">Total collection</p>
              <p className="text-2xl font-semibold text-ink">{formatCurrency(totalCollection)}</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-ink-muted">Cash</p>
              <p className="text-2xl font-semibold text-ink">{formatCurrency(cash)}</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-ink-muted">UPI</p>
              <p className="text-2xl font-semibold text-ink">{formatCurrency(upi)}</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-ink-muted">Cheque</p>
              <p className="text-2xl font-semibold text-ink">{formatCurrency(cheque)}</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-ink-muted">Pending verification</p>
              <p className={`text-2xl font-semibold ${pending > 0 ? "text-amber-600" : "text-ink"}`}>
                {formatCurrency(pending)}
              </p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-ink-muted">Net collection</p>
              <p className="text-2xl font-semibold text-green-700">{formatCurrency(netCollection)}</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-ink-muted">Returns</p>
              <p className="text-2xl font-semibold text-ink">{filteredReturns.length}</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-ink-muted">Payments recorded</p>
              <p className="text-2xl font-semibold text-ink">{filteredPayments.length}</p>
            </Card>
          </div>
        )}

        <p className="text-xs text-ink-muted">
          Based on the most recent {payments.data?.items.length ?? 0} payments and {returns.data?.items.length ?? 0}{" "}
          returns — for a distributor with higher daily volume, narrow the date range to stay within that sample.
        </p>
      </div>
    </div>
  );
}
