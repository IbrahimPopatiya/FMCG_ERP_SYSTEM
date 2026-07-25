"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useSetCustomerStatus } from "@/lib/hooks/useCustomerMutations";
import { useCustomerDuesById } from "@/lib/hooks/useCustomerDuesById";
import { useOrders } from "@/lib/hooks/useOrders";
import { usePaymentsManage } from "@/lib/hooks/usePayments";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

type LedgerTab = "all" | "orders" | "payments";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export default function CustomerDetailPage() {
  useRoleGuard(["admin", "salesman", "manager", "cashier"]);

  const { customerId } = useParams<{ customerId: string }>();
  const customer = useCustomer(customerId);
  const setStatus = useSetCustomerStatus(customerId);
  const dues = useCustomerDuesById(customerId);
  const orders = useOrders();
  const payments = usePaymentsManage();
  const [ledgerTab, setLedgerTab] = useState<LedgerTab>("all");

  const customerOrders = useMemo(
    () =>
      (orders.data ?? [])
        .filter((o) => o.customer_id === customerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [orders.data, customerId]
  );
  const customerPayments = useMemo(
    () =>
      (payments.data?.pages.flatMap((p) => p.items) ?? [])
        .filter((p) => p.customer_id === customerId)
        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()),
    [payments.data, customerId]
  );

  return (
    <div>
      <AdminTopBar title="Customer" back />

      {customer.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {customer.isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this customer.
          </div>
        </div>
      )}

      {customer.data && (() => {
        const data = customer.data;
        return (
          <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
            <Card className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-ink">{data.business_name}</h1>
                <p className="text-sm text-ink-muted">{data.owner_name}</p>
                <p className="mt-1 font-mono text-xs text-ink-muted">{data.customer_code}</p>
              </div>
              <CustomerStatusBadge status={data.status} />
            </Card>

            <div className="divide-y divide-border rounded-lg border border-border bg-white shadow-sm">
              <Row label="Mobile" value={data.mobile} />
              {data.alternate_mobile && <Row label="Alternate mobile" value={data.alternate_mobile} />}
              {data.gst_number && <Row label="GST number" value={data.gst_number} />}
            </div>

            <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <p className="text-sm text-ink-muted">Address</p>
              <p className="mt-1 text-sm font-medium text-ink">
                {data.address}, {data.city}, {data.state} {data.pincode}
              </p>
            </div>

            <div className="divide-y divide-border rounded-lg border border-border bg-white shadow-sm">
              <Row label="Credit limit" value={formatCurrency(data.credit_limit)} />
              <Row label="Payment terms" value={`${data.payment_terms} days`} />
            </div>

            <div>
              <h2 className="mb-3 text-base font-semibold text-ink">Ledger</h2>
              <div className="grid grid-cols-2 gap-3">
                <Card className="flex flex-col gap-1 rounded-2xl">
                  <p className="text-sm font-medium text-ink-muted">Outstanding balance</p>
                  {dues.isLoading ? (
                    <Skeleton className="h-7 w-20" />
                  ) : (
                    <p className="text-xl font-semibold text-red-600">{formatCurrency(dues.data?.total_due ?? 0)}</p>
                  )}
                </Card>
                <Card className="flex flex-col gap-1 rounded-2xl">
                  <p className="text-sm font-medium text-ink-muted">Credit limit</p>
                  <p className="text-xl font-semibold text-ink">{formatCurrency(data.credit_limit)}</p>
                </Card>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {(["all", "orders", "payments"] as LedgerTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setLedgerTab(tab)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      ledgerTab === tab
                        ? "border-primary bg-primary text-white"
                        : "border-border text-ink-muted hover:bg-surface"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {ledgerTab !== "payments" &&
                  customerOrders.map((o) => (
                    <Card key={o.id} className="flex items-center justify-between gap-3 rounded-2xl">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-ink-muted">{o.order_number}</p>
                        <p className="mt-0.5 text-sm text-ink-muted">{formatDate(o.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{formatCurrency(o.total)}</span>
                        <OrderStatusBadge status={o.status} />
                      </div>
                    </Card>
                  ))}
                {ledgerTab !== "orders" &&
                  customerPayments.map((p) => (
                    <Card key={p.id} className="flex items-center justify-between gap-3 rounded-2xl">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-ink-muted">{p.invoice_number}</p>
                        <p className="mt-0.5 text-sm text-ink-muted">{formatDate(p.payment_date)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">{formatCurrency(p.total_amount)}</span>
                        <Badge tone={p.status === "cleared" ? "success" : p.status === "bounced" ? "danger" : "neutral"}>
                          {p.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                {ledgerTab === "all" && customerOrders.length === 0 && customerPayments.length === 0 && (
                  <Card className="rounded-2xl text-center text-sm text-ink-muted">No activity yet.</Card>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant={data.status === "active" ? "danger" : "primary"}
                isLoading={setStatus.isPending}
                onClick={() => setStatus.mutate(data.status === "active" ? "inactive" : "active")}
              >
                {data.status === "active" ? "Deactivate customer" : "Activate customer"}
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
