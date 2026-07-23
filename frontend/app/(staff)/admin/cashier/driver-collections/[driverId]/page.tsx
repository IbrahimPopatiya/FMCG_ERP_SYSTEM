"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CashierTopBar } from "@/components/cashier/CashierTopBar";
import { CashierDatePicker, CASHIER_TODAY } from "@/components/cashier/CashierDatePicker";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { PaymentRecordStatusBadge } from "@/components/payments/PaymentRecordStatusBadge";
import { useCashierPaymentsSample } from "@/lib/hooks/useCashierCollections";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { formatCurrency, formatDate, isSameDate } from "@/lib/utils/format";
import type { PaymentListItem } from "@/types/payments";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

export default function DriverCollectionDetailPage() {
  useRoleGuard(["admin", "cashier", "manager"]);

  const params = useParams<{ driverId: string }>();
  const driverId = params.driverId;
  const [date, setDate] = useState(CASHIER_TODAY);

  const payments = useCashierPaymentsSample();
  const users = useStaffDirectory();
  const customers = useCustomerDirectorySample();

  const driver = users.data?.find((u) => u.id === driverId);

  const dayPayments = useMemo(
    () =>
      (payments.data?.items ?? []).filter((p) => p.driver_id === driverId && isSameDate(p.payment_date, date)),
    [payments.data, driverId, date]
  );

  const cash = dayPayments.reduce((sum, p) => sum + p.cash_amount, 0);
  const upi = dayPayments.reduce((sum, p) => sum + p.upi_amount, 0);
  const cheque = dayPayments.reduce((sum, p) => sum + p.cheque_amount, 0);
  const total = cash + upi + cheque;
  const pending = dayPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.total_amount, 0);

  const customerName = (customerId: string) =>
    customers.data?.items.find((c) => c.id === customerId)?.business_name ?? "Customer";

  const isLoading = payments.isLoading || users.isLoading;

  return (
    <div>
      <CashierTopBar title={driver?.full_name ?? "Driver Collections"} subtitle={date} back />

      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <CashierDatePicker value={date} onChange={setDate} />

        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <Card>
            <p className="text-lg font-semibold text-ink">{driver?.full_name ?? "Driver"}</p>
            <p className="text-sm text-ink-muted">{driver?.mobile}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-ink-muted">Cash</p>
                <p className="text-base font-semibold text-ink">{formatCurrency(cash)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">UPI</p>
                <p className="text-base font-semibold text-ink">{formatCurrency(upi)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Cheque</p>
                <p className="text-base font-semibold text-ink">{formatCurrency(cheque)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Pending</p>
                <p className={`text-base font-semibold ${pending > 0 ? "text-amber-600" : "text-ink"}`}>
                  {formatCurrency(pending)}
                </p>
              </div>
            </div>
            <p className="mt-4 border-t border-border pt-3 text-sm text-ink-muted">
              Total collected: <span className="font-semibold text-ink">{formatCurrency(total)}</span>
            </p>
          </Card>
        )}

        <div>
          <h2 className="mb-3 text-base font-semibold text-ink">Payments</h2>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<PaymentListItem>
                rowKey={(p) => p.id}
                rows={dayPayments}
                emptyMessage="No payments collected on this date."
                columns={[
                  {
                    header: "Invoice",
                    render: (p) => (
                      <Link
                        href={`/admin/payments/${p.id}`}
                        className="font-mono text-xs font-medium text-ink hover:text-primary"
                      >
                        {p.invoice_number}
                      </Link>
                    ),
                  },
                  { header: "Customer", render: (p) => customerName(p.customer_id) },
                  { header: "Amount", render: (p) => formatCurrency(p.total_amount) },
                  { header: "Status", render: (p) => <PaymentRecordStatusBadge status={p.status} /> },
                  { header: "Time", render: (p) => formatDate(p.payment_date) },
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
