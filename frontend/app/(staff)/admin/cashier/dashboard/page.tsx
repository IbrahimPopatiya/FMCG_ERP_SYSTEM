"use client";

import { useState } from "react";
import Link from "next/link";
import { CashierTopBar } from "@/components/cashier/CashierTopBar";
import { CashierDatePicker, CASHIER_TODAY } from "@/components/cashier/CashierDatePicker";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  OrdersIcon,
  TruckIcon,
  WalletIcon,
  ChartIcon,
  ReceiptIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
} from "@/components/cashier/icons";
import { useCashierPaymentsSample, useCashierReturnsSample } from "@/lib/hooks/useCashierCollections";
import { useOrders } from "@/lib/hooks/useOrders";
import { formatCurrency, isSameDate } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const QUICK_ACTIONS = [
  {
    href: "/admin/cashier/orders",
    label: "Orders",
    hint: "View orders & payment status",
    icon: OrdersIcon,
  },
  {
    href: "/admin/cashier/driver-collections",
    label: "Driver Payments",
    hint: "View driver collections",
    icon: TruckIcon,
  },
  {
    href: "/admin/cashier/party-balance",
    label: "Party Balance",
    hint: "Update customer balance",
    icon: WalletIcon,
  },
  {
    href: "/admin/cashier/expense",
    label: "Expense Entry",
    hint: "Add daily expenses",
    icon: ReceiptIcon,
  },
  {
    href: "/admin/cashier/reports",
    label: "Reports",
    hint: "Collection & summary",
    icon: ChartIcon,
  },
];

function SummaryTile({
  label,
  value,
  isLoading,
  tone = "neutral",
}: {
  label: string;
  value: string;
  isLoading: boolean;
  tone?: "neutral" | "warning" | "danger" | "success";
}) {
  const valueClass =
    tone === "warning"
      ? "text-amber-600"
      : tone === "danger"
        ? "text-red-600"
        : tone === "success"
          ? "text-primary"
          : "text-ink";

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      {isLoading ? <Skeleton className="h-6 w-16" /> : <p className={`text-lg font-semibold ${valueClass}`}>{value}</p>}
    </div>
  );
}

export default function CashierDashboardPage() {
  useRoleGuard(["admin", "cashier", "manager"]);

  const [date, setDate] = useState(CASHIER_TODAY);

  const orders = useOrders();
  const payments = useCashierPaymentsSample();
  const returns = useCashierReturnsSample();

  const daysOrders = (orders.data ?? []).filter((o) => isSameDate(o.created_at, date));
  const daysOrderAmount = daysOrders.reduce((sum, o) => sum + o.total, 0);

  const dayPayments = (payments.data?.items ?? []).filter((p) => isSameDate(p.payment_date, date));
  const cash = dayPayments.reduce((sum, p) => sum + p.cash_amount, 0);
  const upi = dayPayments.reduce((sum, p) => sum + p.upi_amount, 0);
  const cheque = dayPayments.reduce((sum, p) => sum + p.cheque_amount, 0);
  const totalCollection = cash + upi + cheque;
  const pending = dayPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.total_amount, 0);
  const netCollection = totalCollection - pending;

  const daysReturns = (returns.data?.items ?? []).filter((r) => isSameDate(r.created_at, date));

  const summaryLoading = payments.isLoading || orders.isLoading;

  return (
    <div>
      <CashierTopBar title="Cashier Home" subtitle={date} />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <CashierDatePicker value={date} onChange={setDate} />

        <Card className="p-4">
          <h2 className="mb-4 text-sm font-semibold text-ink">Summary</h2>
          <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
            <SummaryTile label="Total Orders" value={String(daysOrders.length)} isLoading={summaryLoading} />
            <SummaryTile label="Total Order Amount" value={formatCurrency(daysOrderAmount)} isLoading={summaryLoading} />
            <SummaryTile label="Amount Received" value={formatCurrency(totalCollection)} isLoading={summaryLoading} />
            <SummaryTile label="Cash Collected" value={formatCurrency(cash)} isLoading={summaryLoading} />
            <SummaryTile label="UPI Collected" value={formatCurrency(upi)} isLoading={summaryLoading} />
            <SummaryTile label="Cheque Collected" value={formatCurrency(cheque)} isLoading={summaryLoading} />
            <SummaryTile
              label="Pending to Collect"
              value={formatCurrency(pending)}
              isLoading={summaryLoading}
              tone={pending > 0 ? "warning" : "neutral"}
            />
            <SummaryTile label="Total Returns" value={String(daysReturns.length)} isLoading={returns.isLoading} />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-primary-soft px-3.5 py-3">
            <p className="text-sm font-medium text-ink">Net Collection</p>
            {summaryLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-lg font-semibold text-primary">{formatCurrency(netCollection)}</p>
            )}
          </div>
        </Card>

        {!summaryLoading && pending > 0 && (
          <Link href="/admin/payments">
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-amber-800">
              <AlertTriangleIcon className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">
                {formatCurrency(pending)} pending verification — tap to review payments
              </p>
            </div>
          </Link>
        )}

        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Quick Actions</h2>
          <Card className="flex flex-col divide-y divide-border p-0">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{action.label}</p>
                    <p className="text-xs text-ink-muted">{action.hint}</p>
                  </span>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
                </Link>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}
