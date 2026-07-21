"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { CreditNoteStatusBadge } from "@/components/creditNotes/CreditNoteStatusBadge";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { useCreditNotesManage } from "@/lib/hooks/useCreditNotes";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { CreditNoteResponse, CreditNoteStatus } from "@/types/creditNotes";

const STATUS_FILTERS: { value: CreditNoteStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
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

export default function CreditNotesPage() {
  const [statusFilter, setStatusFilter] = useState<CreditNoteStatus | "all">("all");

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCreditNotesManage();
  const customers = useCustomerDirectorySample();

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const customerName = (customerId: string) =>
    customers.data?.items.find((c) => c.id === customerId)?.business_name ?? "Customer";

  const total = data?.pages[0]?.total ?? 0;
  const filtered = useMemo(() => {
    const allCreditNotes = data?.pages.flatMap((page) => page.items) ?? [];
    return allCreditNotes.filter((cn) => statusFilter === "all" || cn.status === statusFilter);
  }, [data, statusFilter]);

  return (
    <div>
      <TopBar title="Credit Notes" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Credit notes</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {total > 0
              ? `${total} credit note${total === 1 ? "" : "s"}`
              : "Amounts owed back to customers from completed returns"}
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
            Couldn&apos;t load credit notes.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No credit notes here</p>
          <p className="text-sm text-ink-muted">
            {statusFilter === "all"
              ? "Completing a return automatically issues one."
              : "Try a different status filter."}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<CreditNoteResponse>
                rowKey={(cn) => cn.id}
                rows={filtered}
                columns={[
                  {
                    header: "Customer",
                    render: (cn) => (
                      <Link
                        href={`/admin/credit-notes/${cn.id}`}
                        className="font-medium text-ink hover:text-primary"
                      >
                        {customerName(cn.customer_id)}
                      </Link>
                    ),
                  },
                  { header: "Amount", render: (cn) => formatCurrency(cn.amount) },
                  { header: "Status", render: (cn) => <CreditNoteStatusBadge status={cn.status} /> },
                  { header: "Issued", render: (cn) => formatDate(cn.created_at) },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((cn) => (
              <Link key={cn.id} href={`/admin/credit-notes/${cn.id}`}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{customerName(cn.customer_id)}</p>
                    <p className="mt-1 text-sm text-ink-muted">{formatCurrency(cn.amount)}</p>
                  </div>
                  <CreditNoteStatusBadge status={cn.status} />
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
