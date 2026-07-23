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
import { ReturnForm } from "@/components/returns/ReturnForm";
import { ReturnStatusBadge } from "@/components/returns/ReturnStatusBadge";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { useReturnsManage } from "@/lib/hooks/useReturns";
import { useCreateReturn } from "@/lib/hooks/useReturnMutations";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { formatDate, toTitleCase } from "@/lib/utils/format";
import type { ReturnListItem, ReturnStatus } from "@/types/returns";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const STATUS_FILTERS: { value: ReturnStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
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

export default function ReturnsPage() {
  useRoleGuard(["admin", "manager"]);

  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "all">("all");
  const [isFormOpen, setFormOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReturnsManage();
  const customers = useCustomerDirectorySample();
  const createReturn = useCreateReturn();

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const customerName = (customerId: string) =>
    customers.data?.items.find((c) => c.id === customerId)?.business_name ?? "Customer";

  const total = data?.pages[0]?.total ?? 0;
  const filtered = useMemo(() => {
    const allReturns = data?.pages.flatMap((page) => page.items) ?? [];
    return allReturns.filter((r) => statusFilter === "all" || r.status === statusFilter);
  }, [data, statusFilter]);

  return (
    <div>
      <TopBar title="Returns" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Returns</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {total > 0 ? `${total} return${total === 1 ? "" : "s"}` : "Damaged, expired or wrong items sent back"}
            </p>
          </div>
          <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
            Request return
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
            Couldn&apos;t load returns.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No returns here</p>
          <p className="text-sm text-ink-muted">
            {statusFilter === "all" ? "Request one from an invoice to get started." : "Try a different status filter."}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<ReturnListItem>
                rowKey={(r) => r.id}
                rows={filtered}
                columns={[
                  {
                    header: "Invoice",
                    render: (r) => (
                      <Link
                        href={`/admin/returns/${r.id}`}
                        className="font-mono text-xs font-medium text-ink hover:text-primary"
                      >
                        {r.invoice_number}
                      </Link>
                    ),
                  },
                  { header: "Customer", render: (r) => customerName(r.customer_id) },
                  { header: "Reason", render: (r) => toTitleCase(r.reason) },
                  { header: "Status", render: (r) => <ReturnStatusBadge status={r.status} /> },
                  { header: "Requested", render: (r) => formatDate(r.created_at) },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((r) => (
              <Link key={r.id} href={`/admin/returns/${r.id}`}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{customerName(r.customer_id)}</p>
                    <p className="font-mono text-xs text-ink-muted">{r.invoice_number}</p>
                    <p className="mt-1 text-sm text-ink-muted">{toTitleCase(r.reason)}</p>
                  </div>
                  <ReturnStatusBadge status={r.status} />
                </Card>
              </Link>
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Request return">
        <ReturnForm
          onSubmit={(payload) => createReturn.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
