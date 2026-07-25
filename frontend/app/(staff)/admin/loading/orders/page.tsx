"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTopBar, AdminIconButton } from "@/components/admin/AdminTopBar";
import { SearchIcon, FilterIcon } from "@/components/admin/icons";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLoadableOrders, useTrips } from "@/lib/hooks/useTrips";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useTripDraft } from "@/components/loading/TripDraftContext";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatDate } from "@/lib/utils/format";

type Tab = "all" | "pending" | "loading" | "loaded";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "loading", label: "Loading" },
  { id: "loaded", label: "Loaded" },
];

export default function LoadingOrdersPage() {
  useRoleGuard(["admin", "dispatcher", "manager"]);

  const router = useRouter();
  const loadableOrders = useLoadableOrders();
  const trips = useTrips();
  const customers = useCustomers(200);
  const draft = useTripDraft();

  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const customerName = (id: string) => customers.data?.items.find((c) => c.id === id)?.business_name ?? "Customer";

  const loadingOrders = useMemo(
    () =>
      (trips.data ?? [])
        .filter((t) => t.status === "loading")
        .flatMap((t) => t.orders.map((o) => ({ ...o, tripId: t.id }))),
    [trips.data]
  );
  const loadedOrders = useMemo(
    () =>
      (trips.data ?? [])
        .filter((t) => t.status === "out_for_delivery" || t.status === "delivered")
        .flatMap((t) => t.orders.map((o) => ({ ...o, tripId: t.id }))),
    [trips.data]
  );

  const pendingRows = (loadableOrders.data ?? []).filter((o) =>
    search ? o.order_number.toLowerCase().includes(search.toLowerCase()) : true
  );

  const isLoading = loadableOrders.isLoading || trips.isLoading;
  const selectedCount = draft.orderIds.length;
  const selectedLc = pendingRows
    .filter((o) => draft.orderIds.includes(o.id))
    .reduce((s, o) => s + o.lc_value, 0);

  return (
    <div className="pb-24">
      <AdminTopBar
        title="Orders (LC)"
        subtitle="List of orders with LC per order"
        back
        right={
          <>
            <AdminIconButton label="Search" onClick={() => setShowSearch((v) => !v)}>
              <SearchIcon className="h-5 w-5" />
            </AdminIconButton>
            <AdminIconButton label="Filter">
              <FilterIcon className="h-5 w-5" />
            </AdminIconButton>
          </>
        }
      />

      <div className="sticky top-[68px] z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-3 sm:px-6">
        {showSearch && (
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number…"
            className="h-10 w-full rounded-lg border border-border px-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
          />
        )}
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                tab === t.id ? "border-primary bg-primary text-white" : "border-border text-ink-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 sm:p-6">
        {isLoading && (
          <>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </>
        )}

        {!isLoading && (tab === "all" || tab === "pending") && pendingRows.length === 0 && tab === "pending" && (
          <p className="py-8 text-center text-sm text-ink-muted">No orders waiting to be assigned to a trip.</p>
        )}

        {!isLoading &&
          (tab === "all" || tab === "pending") &&
          pendingRows.map((order) => {
            const checked = draft.orderIds.includes(order.id);
            return (
              <Card
                key={order.id}
                className={`flex items-center gap-3 ${checked ? "border-primary" : ""}`}
                onClick={() => draft.toggleOrder(order.id)}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => draft.toggleOrder(order.id)}
                  className="h-5 w-5 shrink-0 accent-primary"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{customerName(order.customer_id)}</p>
                  <p className="text-xs text-ink-muted">
                    {order.order_number} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-ink">LC: {order.lc_value.toFixed(2)}</p>
                  <Badge tone="warning">Pending</Badge>
                </div>
              </Card>
            );
          })}

        {!isLoading &&
          (tab === "all" || tab === "loading") &&
          loadingOrders.map((order) => (
            <Card key={order.sales_order_id} className="flex items-center gap-3 opacity-70">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{order.order_number}</p>
                <p className="text-xs text-ink-muted">On trip · being loaded</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-ink">LC: {order.lc_value.toFixed(2)}</p>
                <Badge tone="warning">Loading</Badge>
              </div>
            </Card>
          ))}

        {!isLoading &&
          (tab === "all" || tab === "loaded") &&
          loadedOrders.map((order) => (
            <Card key={order.sales_order_id} className="flex items-center gap-3 opacity-70">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{order.order_number}</p>
                <p className="text-xs text-ink-muted">Loaded · out for delivery</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-ink">LC: {order.lc_value.toFixed(2)}</p>
                <Badge tone="success">Loaded</Badge>
              </div>
            </Card>
          ))}
      </div>

      {selectedCount > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-20 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:static sm:mt-0 sm:bg-transparent sm:p-0 sm:px-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-ink-muted">{selectedCount} selected</span>
            <span className="font-semibold text-ink">Total LC: {selectedLc.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/admin/loading/assign-vehicle")}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white"
          >
            Select Orders
          </button>
        </div>
      )}
    </div>
  );
}
