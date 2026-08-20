"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { PrintBillButton } from "@/components/orders/PrintBillButton";
import { SearchIcon, FilterIcon, PersonIcon, BoxIcon, ChevronRightIcon } from "@/components/admin/icons";
import { CalendarIcon } from "@/components/customer/icons";
import { useOrders } from "@/lib/hooks/useOrders";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { useIsDesktop } from "@/lib/hooks/useIsDesktop";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { OrderStatus, SalesOrderResponse } from "@/types/salesOrder";

const STATUS_FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Order Placed" },
  { value: "approved", label: "Out for Delivery" },
  { value: "loaded", label: "Completed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

// Local (not UTC) yyyy-mm-dd, matching what <input type="date"> reads/writes.
function toDateInputValue(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDate(iso: string, dateValue: string) {
  return toDateInputValue(new Date(iso)) === dateValue;
}

function formatDateLabel(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function totalLoadingCapacity(order: SalesOrderResponse): number {
  const total = order.items.reduce((sum, item) => {
    const boxes = item.ordered_qty / (item.units_per_box || 1);
    return sum + item.loading_capacity * boxes;
  }, 0);
  return Math.round(total * 10) / 10;
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export interface OrdersListPageProps {
  // "/admin/orders" | "/salesman/orders" — used for both row links and the
  // "browse products" empty-state CTA fallback.
  basePath: string;
  // Admin resolves this from a customer directory lookup by customer_id;
  // salesman orders already carry customer_name from the API.
  customerName: (order: SalesOrderResponse) => string;
  emptyState?: {
    title: string;
    message: string;
    cta?: { href: string; label: string };
  };
}

export function OrdersListPage({ basePath, customerName, emptyState }: OrdersListPageProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [draftDate, setDraftDate] = useState("");
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOrders();

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);
  const isDesktop = useIsDesktop();

  const allLoaded = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const sorted = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allLoaded
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => !selectedDate || isSameDate(o.created_at, selectedDate))
      .filter((o) => {
        if (!term) return true;
        return (
          o.order_number.toLowerCase().includes(term) || customerName(o).toLowerCase().includes(term)
        );
      });
  }, [allLoaded, statusFilter, selectedDate, search, customerName]);

  function openDateModal() {
    setDraftDate(selectedDate ?? toDateInputValue(new Date()));
    setDateModalOpen(true);
  }

  function applyDateFilter() {
    setSelectedDate(draftDate || null);
    setDateModalOpen(false);
  }

  function clearDateFilter() {
    setSelectedDate(null);
    setDateModalOpen(false);
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/70 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-soft"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              showFilters ? "border-primary bg-primary-soft text-primary" : "border-border text-ink-muted hover:bg-surface"
            }`}
            aria-label="Filter orders by status"
          >
            <FilterIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={openDateModal}
            className={`flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors ${
              selectedDate ? "border-primary bg-primary-soft text-primary" : "border-border text-ink-muted hover:bg-surface"
            }`}
            aria-label="Filter orders by date"
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{selectedDate ? formatDateLabel(selectedDate) : "Date"}</span>
          </button>
        </div>
        {showFilters && (
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
        )}
      </header>

      {isLoading && <SkeletonRows />}

      {isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load orders.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && sorted.length === 0 && !hasNextPage && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">
            {statusFilter === "all" && !search && !selectedDate
              ? emptyState?.title ?? "No orders here"
              : "No orders here"}
          </p>
          <p className="text-sm text-ink-muted">
            {statusFilter === "all" && !search && !selectedDate
              ? emptyState?.message ?? "No orders have been placed yet."
              : "Try a different search or filter."}
          </p>
          {statusFilter === "all" && !search && !selectedDate && emptyState?.cta && (
            <Link href={emptyState.cta.href}>
              <Button type="button" className="mt-1">
                {emptyState.cta.label}
              </Button>
            </Link>
          )}
        </div>
      )}

      {!isLoading && !isError && (sorted.length > 0 || hasNextPage) && (
        <div className="p-4 pb-10 sm:p-6">
          {/* Desktop: full data table */}
          {isDesktop && (
            <div className="hidden sm:block">
              <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                <Table<SalesOrderResponse>
                  rowKey={(o) => o.id}
                  rows={sorted}
                  columns={[
                    {
                      header: "Order",
                      render: (o) => (
                        <Link
                          href={`${basePath}/${o.id}`}
                          className="font-mono text-xs font-medium text-ink hover:text-primary"
                        >
                          {o.order_number}
                        </Link>
                      ),
                    },
                    { header: "Customer", render: (o) => customerName(o) },
                    { header: "Items", render: (o) => `${o.items.length} item${o.items.length === 1 ? "" : "s"}` },
                    { header: "Total LC", render: (o) => totalLoadingCapacity(o) },
                    { header: "Status", render: (o) => <OrderStatusBadge status={o.status} /> },
                    { header: "Amount", render: (o) => formatCurrency(o.total) },
                    { header: "Placed", render: (o) => formatDate(o.created_at) },
                    {
                      header: "",
                      render: (o) => (
                        <PrintBillButton order={o} customerName={customerName(o)} compact />
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Mobile: card list */}
          {isDesktop === false && (
            <div className="flex flex-col gap-3 sm:hidden">
              {sorted.map((o) => (
                <Link key={o.id} href={`${basePath}/${o.id}`}>
                  <Card className="flex items-center gap-3 rounded-2xl">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink">#{o.order_number}</p>
                        <p className="shrink-0 text-xs text-ink-muted">{formatDate(o.created_at)}</p>
                      </div>
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
                        <PersonIcon className="h-3.5 w-3.5" />
                        {customerName(o)}
                        <span className="text-ink-muted/60">· Total LC: {totalLoadingCapacity(o)}</span>
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                          <BoxIcon className="h-4 w-4 text-ink-muted" />
                          {formatCurrency(o.total)}
                        </p>
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={o.status} />
                          <PrintBillButton order={o} customerName={customerName(o)} compact />
                        </div>
                      </div>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}

      <Modal open={dateModalOpen} onClose={() => setDateModalOpen(false)} title="Filter by date">
        <div className="flex flex-col gap-4">
          <Input
            type="date"
            label="Order date"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
            max={toDateInputValue(new Date())}
          />
          <div className="flex items-center gap-3">
            {selectedDate && (
              <Button type="button" variant="secondary" className="flex-1" onClick={clearDateFilter}>
                Clear
              </Button>
            )}
            <Button type="button" className="flex-1" onClick={applyDateFilter} disabled={!draftDate}>
              Apply
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
