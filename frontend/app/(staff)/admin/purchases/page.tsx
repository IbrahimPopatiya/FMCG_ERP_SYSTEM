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
import { PurchaseForm } from "@/components/purchases/PurchaseForm";
import { PurchaseStatusBadge } from "@/components/purchases/PurchaseStatusBadge";
import { useCreatePurchase } from "@/lib/hooks/usePurchaseMutations";
import { usePurchasesManage } from "@/lib/hooks/usePurchases";
import { useSuppliers } from "@/lib/hooks/useSuppliers";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PurchaseResponse, PurchaseStatus } from "@/types/purchases";

const STATUS_FILTERS: { value: PurchaseStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
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

export default function PurchasesPage() {
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | "all">("all");
  const [isFormOpen, setFormOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePurchasesManage();
  const suppliers = useSuppliers();
  const createPurchase = useCreatePurchase();

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const supplierName = (supplierId: string) =>
    suppliers.data?.find((s) => s.id === supplierId)?.name ?? "Supplier";

  const total = data?.pages[0]?.total ?? 0;
  const filtered = useMemo(() => {
    const allPurchases = data?.pages.flatMap((page) => page.items) ?? [];
    return allPurchases.filter((p) => statusFilter === "all" || p.status === statusFilter);
  }, [data, statusFilter]);

  return (
    <div>
      <TopBar title="Purchases" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Purchases</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {total > 0 ? `${total} purchase${total === 1 ? "" : "s"}` : "Stock ordered in from suppliers"}
            </p>
          </div>
          <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
            Create purchase
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
            Couldn&apos;t load purchases.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No purchases here</p>
          <p className="text-sm text-ink-muted">
            {statusFilter === "all" ? "Create one to order stock from a supplier." : "Try a different status filter."}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<PurchaseResponse>
                rowKey={(p) => p.id}
                rows={filtered}
                columns={[
                  {
                    header: "Purchase",
                    render: (p) => (
                      <Link
                        href={`/admin/purchases/${p.id}`}
                        className="font-mono text-xs font-medium text-ink hover:text-primary"
                      >
                        {p.purchase_number}
                      </Link>
                    ),
                  },
                  { header: "Supplier", render: (p) => supplierName(p.supplier_id) },
                  { header: "Total", render: (p) => formatCurrency(p.total) },
                  { header: "Status", render: (p) => <PurchaseStatusBadge status={p.status} /> },
                  { header: "Date", render: (p) => formatDate(p.purchase_date) },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((p) => (
              <Link key={p.id} href={`/admin/purchases/${p.id}`}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{supplierName(p.supplier_id)}</p>
                    <p className="font-mono text-xs text-ink-muted">{p.purchase_number}</p>
                    <p className="mt-1 text-sm text-ink-muted">{formatCurrency(p.total)}</p>
                  </div>
                  <PurchaseStatusBadge status={p.status} />
                </Card>
              </Link>
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Create purchase">
        <PurchaseForm
          onSubmit={(payload) => createPurchase.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
