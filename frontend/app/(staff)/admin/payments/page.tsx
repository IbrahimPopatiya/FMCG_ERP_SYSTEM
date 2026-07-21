"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { PaymentRecordStatusBadge } from "@/components/payments/PaymentRecordStatusBadge";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { usePaymentsManage } from "@/lib/hooks/usePayments";
import { useRecordPayment } from "@/lib/hooks/usePaymentMutations";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PaymentListItem, PaymentRecordStatus } from "@/types/payments";

const STATUS_FILTERS: { value: PaymentRecordStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "cleared", label: "Cleared" },
  { value: "bounced", label: "Bounced" },
];

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<PaymentRecordStatus | "all">("all");
  const [isFormOpen, setFormOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaymentsManage();
  const customers = useCustomerDirectorySample();
  const recordPayment = useRecordPayment();

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const customerName = (customerId: string) =>
    customers.data?.items.find((c) => c.id === customerId)?.business_name ?? "Customer";

  const total = data?.pages[0]?.total ?? 0;
  const filtered = useMemo(() => {
    const allPayments = data?.pages.flatMap((page) => page.items) ?? [];
    return allPayments.filter((p) => statusFilter === "all" || p.status === statusFilter);
  }, [data, statusFilter]);

  return (
    <div>
      <TopBar title="Payments" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Payments</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {total > 0 ? `${total} payment${total === 1 ? "" : "s"}` : "Cash, UPI and cheque collections"}
            </p>
          </div>
          <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
            Record payment
          </Button>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === filter.value
                  ? "border-primary bg-primary text-white"
                  : "border-border text-ink-muted hover:bg-surface"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading && <SkeletonRows />}

      {isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load payments.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No payments here</p>
          <p className="text-sm text-ink-muted">
            {statusFilter === "all" ? "Record one against an invoice to get started." : "Try a different status filter."}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<PaymentListItem>
                rowKey={(p) => p.id}
                rows={filtered}
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
                  { header: "Date", render: (p) => formatDate(p.payment_date) },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((p) => (
              <Link key={p.id} href={`/admin/payments/${p.id}`}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{customerName(p.customer_id)}</p>
                    <p className="font-mono text-xs text-ink-muted">{p.invoice_number}</p>
                    <p className="mt-1 text-sm text-ink-muted">{formatCurrency(p.total_amount)}</p>
                  </div>
                  <PaymentRecordStatusBadge status={p.status} />
                </Card>
              </Link>
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Record payment">
        <PaymentForm
          onSubmit={(payload) => recordPayment.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
