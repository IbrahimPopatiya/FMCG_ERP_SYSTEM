"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { Skeleton } from "@/components/ui/Skeleton";
import { useOrder } from "@/lib/hooks/useOrders";
import { useLoadOrder } from "@/lib/hooks/useOrderMutations";
import { useProducts } from "@/lib/hooks/useProducts";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatCurrency } from "@/lib/utils/format";

export default function TripOrderLoadingPage() {
  useRoleGuard(["admin", "dispatcher", "manager"]);

  const router = useRouter();
  const { tripId, orderId } = useParams<{ tripId: string; orderId: string }>();

  const order = useOrder(orderId);
  const customer = useCustomer(order.data?.customer_id ?? "");
  const products = useProducts();
  const loadOrder = useLoadOrder(orderId);

  const [qtyByItem, setQtyByItem] = useState<Record<string, number>>({});
  // The loader must explicitly tick each item off as they physically load
  // it - this is independent of quantity, so it starts empty (nothing
  // pre-checked) rather than defaulting to "checked because qty > 0".
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const productName = (productId: string) => products.data?.find((p) => p.id === productId)?.name ?? "Product";

  function qtyFor(itemId: string, fallback: number): number {
    return qtyByItem[itemId] ?? fallback;
  }

  if (order.isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order.data) {
    return (
      <div>
        <AdminTopBar title="Order Items" back />
        <p className="p-6 text-sm text-ink-muted">Order not found.</p>
      </div>
    );
  }

  const o = order.data;
  const alreadyLoaded = o.status === "loaded" || o.status === "delivered";
  const selectedLc = o.items.reduce((sum, item) => sum + qtyFor(item.id, item.approved_qty || item.ordered_qty), 0);
  const totalLc = o.items.reduce((sum, item) => sum + (item.approved_qty || item.ordered_qty), 0);
  const allChecked = alreadyLoaded || o.items.every((item) => checkedItems[item.id]);

  async function handleDone() {
    setError("");
    if (!allChecked) {
      setError("Item is not added — tick every item before marking this order done.");
      return;
    }
    try {
      await loadOrder.mutateAsync(
        o!.items.map((item) => ({
          item_id: item.id,
          loaded_qty: qtyFor(item.id, item.approved_qty || item.ordered_qty),
        }))
      );
      router.push(`/admin/loading/trips/${tripId}`);
    } catch {
      setError("Couldn't save loaded quantities. Please try again.");
    }
  }

  return (
    <div className="pb-8">
      <AdminTopBar title={o.order_number} subtitle={customer.data?.business_name} back />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <Card className="flex items-center justify-between p-4">
          <p className="text-sm font-medium text-ink">Order LC</p>
          <p className="text-lg font-semibold text-primary">{totalLc.toFixed(2)}</p>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Items ({o.items.length})</h2>
          {allChecked && (
            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                ✓
              </span>
              All items complete
            </span>
          )}
        </div>
        <Card className="flex flex-col divide-y divide-border p-0">
          {o.items.map((item) => {
            const qty = qtyFor(item.id, item.approved_qty || item.ordered_qty);
            const checked = alreadyLoaded || !!checkedItems[item.id];
            return (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={alreadyLoaded}
                  onChange={(e) =>
                    setCheckedItems((prev) => ({ ...prev, [item.id]: e.target.checked }))
                  }
                  className="h-5 w-5 shrink-0 accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{productName(item.product_id)}</p>
                  <p className="text-xs text-ink-muted">{formatCurrency(item.price)} each</p>
                </div>
                {editing && !alreadyLoaded ? (
                  <QtyStepper
                    size="sm"
                    qty={qty}
                    onChange={(next) => setQtyByItem((prev) => ({ ...prev, [item.id]: Math.max(0, next) }))}
                  />
                ) : (
                  <p className="w-10 shrink-0 text-right text-sm font-semibold text-ink">{qty}</p>
                )}
              </div>
            );
          })}
        </Card>

        <Card className="flex items-center justify-between p-4">
          <p className="text-sm font-medium text-ink">Selected Items LC</p>
          <p className="text-sm font-semibold text-ink">
            {selectedLc.toFixed(2)} / {totalLc.toFixed(2)}
          </p>
        </Card>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        {alreadyLoaded ? (
          <Button variant="secondary" className="w-full" onClick={() => router.push(`/admin/loading/trips/${tripId}`)}>
            Back to Trip
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
              {editing ? "Lock Quantity" : "Edit Quantity"}
            </Button>
            <Button isLoading={loadOrder.isPending} onClick={handleDone}>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
