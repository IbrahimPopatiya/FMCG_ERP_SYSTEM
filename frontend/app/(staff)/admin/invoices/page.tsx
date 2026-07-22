"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { PaymentStatusBadge } from "@/components/invoices/PaymentStatusBadge";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { useInvoicesManage } from "@/lib/hooks/useInvoices";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { InvoiceListItem, PaymentStatus } from "@/types/invoices";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const STATUS_FILTERS: { value: PaymentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
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

export default function InvoicesPage() {
  useRoleGuard(["admin", "manager", "cashier"]);

  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInvoicesManage();
  const customers = useCustomerDirectorySample();

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const customerName = (customerId: string) =>
    customers.data?.items.find((c) => c.id === customerId)?.business_name ?? "Customer";

  const total = data?.pages[0]?.total ?? 0;
  const filtered = useMemo(() => {
    const allInvoices = data?.pages.flatMap((page) => page.items) ?? [];
    return allInvoices.filter((inv) => statusFilter === "all" || inv.payment_status === statusFilter);
  }, [data, statusFilter]);

  return (
    <div>
      <TopBar title="Invoices" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Invoices</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {total > 0 ? `${total} invoice${total === 1 ? "" : "s"}` : "Billing for delivered and pending orders"}
          </p>
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
            Couldn&apos;t load invoices.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No invoices here</p>
          <p className="text-sm text-ink-muted">
            {statusFilter === "all"
              ? "Invoices generated from orders will show up here."
              : "Try a different status filter."}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<InvoiceListItem>
                rowKey={(inv) => inv.id}
                rows={filtered}
                columns={[
                  {
                    header: "Invoice",
                    render: (inv) => (
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="font-mono text-xs font-medium text-ink hover:text-primary"
                      >
                        {inv.invoice_number}
                      </Link>
                    ),
                  },
                  { header: "Customer", render: (inv) => customerName(inv.customer_id) },
                  { header: "Order", render: (inv) => inv.order_number },
                  { header: "Total", render: (inv) => formatCurrency(inv.total) },
                  { header: "Payment", render: (inv) => <PaymentStatusBadge status={inv.payment_status} /> },
                  { header: "Date", render: (inv) => formatDate(inv.invoice_date) },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((inv) => (
              <Link key={inv.id} href={`/admin/invoices/${inv.id}`}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{customerName(inv.customer_id)}</p>
                    <p className="font-mono text-xs text-ink-muted">{inv.invoice_number}</p>
                    <p className="mt-1 text-sm text-ink-muted">{formatCurrency(inv.total)}</p>
                  </div>
                  <PaymentStatusBadge status={inv.payment_status} />
                </Card>
              </Link>
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}
    </div>
  );
}
