"use client";

import { useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { CalendarIcon, ChevronDownIcon } from "@/components/customer/icons";
import { useOrderDates, useOrders } from "@/lib/hooks/useOrders";
import { useBulkDeleteOrders } from "@/lib/hooks/useOrderMutations";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatCurrency } from "@/lib/utils/format";
import type { SalesOrderResponse } from "@/types/salesOrder";

function formatDateLabel(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDayLabel(dateValue: string) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long" });
}

// One day's orders, fetched only once its row is expanded. Selection lives
// in the parent (only one day is ever expanded at a time) so there's a
// single sticky delete bar for the whole page, matching Product/Brand
// settings instead of one bar per day.
function DayOrdersPanel({
  date,
  customerName,
  selected,
  onToggle,
  onToggleAll,
}: {
  date: string;
  customerName: (order: SalesOrderResponse) => string;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
}) {
  const { data, isLoading, isError } = useOrders(undefined, date);
  const orders = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const allSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));

  return (
    <div className="flex flex-col gap-2 border-t border-border bg-surface/60 p-2.5">
      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && <p className="px-1 py-2 text-sm text-danger">Couldn&apos;t load this day&apos;s orders.</p>}

      {!isLoading && !isError && orders.length === 0 && (
        <p className="px-1 py-2 text-sm text-ink-muted">No orders on this day.</p>
      )}

      {orders.length > 0 && (
        <button
          type="button"
          onClick={() => onToggleAll(orders.map((o) => o.id))}
          className="self-start px-1 text-xs font-medium text-primary hover:underline"
        >
          {allSelected ? "Deselect all" : `Select all (${orders.length})`}
        </button>
      )}

      <div className="flex flex-col gap-1.5">
        {orders.map((order) => (
          <label
            key={order.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-white px-2.5 py-2 transition-colors hover:bg-surface has-[:checked]:border-primary has-[:checked]:bg-primary-soft/40"
          >
            <input
              type="checkbox"
              checked={selected.has(order.id)}
              onChange={() => onToggle(order.id)}
              className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-2 focus:ring-primary-soft"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-mono text-[11px] font-medium text-ink">{order.order_number}</p>
                <span className="shrink-0 text-xs font-semibold text-ink">{formatCurrency(order.total)}</span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-ink-muted">{customerName(order)}</p>
                <OrderStatusBadge status={order.status} size="xs" />
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function OrderSettingsPage() {
  useRoleGuard(["admin"]);

  const { data: dates, isLoading, isError } = useOrderDates();
  const customers = useCustomerDirectorySample();
  const bulkDelete = useBulkDeleteOrders();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const customerNameById = useMemo(
    () => new Map((customers.data?.items ?? []).map((c) => [c.id, c.business_name])),
    [customers.data]
  );

  function customerName(order: SalesOrderResponse) {
    return customerNameById.get(order.customer_id) ?? "Customer";
  }

  function toggleExpanded(date: string) {
    setExpandedDate((prev) => (prev === date ? null : date));
    setSelected(new Set());
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(ids: string[]) {
    setSelected((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  async function handleDelete() {
    setDeleteError(null);
    try {
      await bulkDelete.mutateAsync(Array.from(selected));
      setSelected(new Set());
      setConfirmOpen(false);
    } catch {
      setConfirmOpen(false);
      setDeleteError("Couldn't delete one or more selected orders. Refresh and try again.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Order Settings" backHref="/admin/orders" />

      <div className="border-b border-border bg-white px-4 py-3 sm:px-6">
        <h1 className="text-base font-semibold tracking-tight text-ink">Order Settings</h1>
        <p className="text-sm text-ink-muted">Pick a day to select and delete its orders</p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3 pb-28 sm:p-4 sm:pb-6">
        {isLoading && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}

        {isError && <p className="py-10 text-center text-sm text-danger">Couldn&apos;t load order days.</p>}

        {!isLoading && !isError && (dates ?? []).length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No orders have been placed yet.</p>
        )}

        {(dates ?? []).map(({ order_date, order_count }) => {
          const expanded = expandedDate === order_date;
          return (
            <Card key={order_date} className="overflow-hidden rounded-2xl p-0 ">
              <button
                type="button"
                onClick={() => toggleExpanded(order_date)}
                className="flex w-full items-center gap-3 text-left sm:p-1"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{formatDayLabel(order_date)}</p>
                  <p className="text-sm text-ink-muted">{formatDateLabel(order_date)}</p>
                </div>
                <Badge tone="neutral">
                  {order_count} order{order_count === 1 ? "" : "s"}
                </Badge>
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </button>

              {expanded && (
                <DayOrdersPanel
                  date={order_date}
                  customerName={customerName}
                  selected={selected}
                  onToggle={toggle}
                  onToggleAll={toggleAll}
                />
              )}
            </Card>
          );
        })}

        {deleteError && (
          <div className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            {deleteError}
          </div>
        )}
      </div>

      <SelectionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onDelete={() => setConfirmOpen(true)}
        isDeleting={bulkDelete.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${selected.size} order${selected.size === 1 ? "" : "s"}?`}
        message="Deleting an order that's approved or loaded also releases its reserved/shipped stock back to inventory. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        isConfirming={bulkDelete.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
