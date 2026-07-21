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
import { DeliveryForm } from "@/components/deliveries/DeliveryForm";
import { DeliveryStatusBadge } from "@/components/deliveries/DeliveryStatusBadge";
import { useCreateDelivery } from "@/lib/hooks/useDeliveryMutations";
import { useDeliveriesManage } from "@/lib/hooks/useDeliveries";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { formatDate } from "@/lib/utils/format";
import type { DeliveryListItem, DeliveryStatus } from "@/types/deliveries";

const STATUS_FILTERS: { value: DeliveryStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
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

export default function DeliveriesPage() {
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">("all");
  const [isFormOpen, setFormOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDeliveriesManage();
  const customers = useCustomerDirectorySample();
  const createDelivery = useCreateDelivery();

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const customerName = (customerId: string) =>
    customers.data?.items.find((c) => c.id === customerId)?.business_name ?? "Customer";

  const total = data?.pages[0]?.total ?? 0;
  const filtered = useMemo(() => {
    const allDeliveries = data?.pages.flatMap((page) => page.items) ?? [];
    return allDeliveries.filter((d) => statusFilter === "all" || d.status === statusFilter);
  }, [data, statusFilter]);

  return (
    <div>
      <TopBar title="Deliveries" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Deliveries</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {total > 0 ? `${total} deliver${total === 1 ? "y" : "ies"}` : "Track dispatch and delivery"}
            </p>
          </div>
          <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
            Create delivery
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
            Couldn&apos;t load deliveries.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No deliveries here</p>
          <p className="text-sm text-ink-muted">
            {statusFilter === "all" ? "Create one from an invoice to get started." : "Try a different status filter."}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<DeliveryListItem>
                rowKey={(d) => d.id}
                rows={filtered}
                columns={[
                  {
                    header: "Invoice",
                    render: (d) => (
                      <Link
                        href={`/admin/deliveries/${d.id}`}
                        className="font-mono text-xs font-medium text-ink hover:text-primary"
                      >
                        {d.invoice_number}
                      </Link>
                    ),
                  },
                  { header: "Customer", render: (d) => customerName(d.customer_id) },
                  { header: "Status", render: (d) => <DeliveryStatusBadge status={d.status} /> },
                  {
                    header: "Departed",
                    render: (d) => (d.departure_time ? formatDate(d.departure_time) : "—"),
                  },
                  {
                    header: "Completed",
                    render: (d) => (d.completion_time ? formatDate(d.completion_time) : "—"),
                  },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((d) => (
              <Link key={d.id} href={`/admin/deliveries/${d.id}`}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{customerName(d.customer_id)}</p>
                    <p className="font-mono text-xs text-ink-muted">{d.invoice_number}</p>
                  </div>
                  <DeliveryStatusBadge status={d.status} />
                </Card>
              </Link>
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Create delivery">
        <DeliveryForm
          onSubmit={(payload) => createDelivery.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
