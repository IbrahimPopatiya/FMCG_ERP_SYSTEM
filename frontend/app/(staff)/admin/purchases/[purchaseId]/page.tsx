"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { PurchaseStatusBadge } from "@/components/purchases/PurchaseStatusBadge";
import { usePurchase } from "@/lib/hooks/usePurchases";
import { useCancelPurchase, useReceivePurchase } from "@/lib/hooks/usePurchaseMutations";
import { useProducts } from "@/lib/hooks/useProducts";
import { useSuppliers } from "@/lib/hooks/useSuppliers";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PurchaseItemResponse } from "@/types/purchases";

function actionErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "This purchase's status changed since you loaded this page. Refresh and try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function PurchaseDetailPage() {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const purchase = usePurchase(purchaseId);
  const products = useProducts();
  const suppliers = useSuppliers();
  const warehouses = useWarehouses();
  const receivePurchase = useReceivePurchase(purchaseId);
  const cancelPurchase = useCancelPurchase(purchaseId);

  const [qtyByItem, setQtyByItem] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmReceive, setConfirmReceive] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const productName = (productId: string) =>
    products.data?.find((p) => p.id === productId)?.name ?? "Product";
  const supplierName = (supplierId: string) =>
    suppliers.data?.find((s) => s.id === supplierId)?.name ?? "—";
  const warehouseName = (warehouseId: string) =>
    warehouses.data?.find((w) => w.id === warehouseId)?.name ?? "—";

  function qtyFor(item: PurchaseItemResponse): string {
    return qtyByItem[item.id] ?? String(item.quantity);
  }

  async function handleReceive() {
    const data = purchase.data;
    if (!data) return;
    setActionError(null);
    try {
      await receivePurchase.mutateAsync(
        data.items.map((item) => ({ item_id: item.id, received_qty: Number(qtyFor(item)) }))
      );
      setConfirmReceive(false);
    } catch (err) {
      setActionError(actionErrorMessage(err));
      setConfirmReceive(false);
    }
  }

  async function handleCancel() {
    setActionError(null);
    try {
      await cancelPurchase.mutateAsync();
      setConfirmCancel(false);
    } catch (err) {
      setActionError(actionErrorMessage(err));
      setConfirmCancel(false);
    }
  }

  return (
    <div>
      <TopBar title="Purchase" />

      {purchase.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {purchase.isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this purchase.
          </div>
        </div>
      )}

      {purchase.data && (() => {
        const data = purchase.data;
        return (
          <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-xs font-medium text-ink-muted">{data.purchase_number}</p>
                <h1 className="mt-1 text-lg font-semibold text-ink">{supplierName(data.supplier_id)}</h1>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {warehouseName(data.warehouse_id)} · {formatDate(data.purchase_date)}
                </p>
              </div>
              <PurchaseStatusBadge status={data.status} />
            </Card>

            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-ink">Items</p>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {data.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{productName(item.product_id)}</p>
                      <p className="text-xs text-ink-muted">
                        {item.quantity} × {formatCurrency(item.purchase_price)}
                      </p>
                    </div>
                    {data.status === "draft" ? (
                      <label className="flex items-center gap-2 text-sm text-ink-muted">
                        Received
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={qtyFor(item)}
                          onChange={(e) =>
                            setQtyByItem((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          className="h-9 w-20 rounded-lg border border-border px-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                        />
                      </label>
                    ) : (
                      <p className="text-sm font-semibold text-ink">{formatCurrency(item.total)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Card className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(data.subtotal)}</span>
              </div>
              {data.cgst > 0 && (
                <div className="flex items-center justify-between text-sm text-ink-muted">
                  <span>CGST</span>
                  <span>{formatCurrency(data.cgst)}</span>
                </div>
              )}
              {data.sgst > 0 && (
                <div className="flex items-center justify-between text-sm text-ink-muted">
                  <span>SGST</span>
                  <span>{formatCurrency(data.sgst)}</span>
                </div>
              )}
              {data.igst > 0 && (
                <div className="flex items-center justify-between text-sm text-ink-muted">
                  <span>IGST</span>
                  <span>{formatCurrency(data.igst)}</span>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-ink">
                <span>Total</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
            </Card>

            {actionError && (
              <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {actionError}
              </div>
            )}

            {data.status === "draft" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => setConfirmCancel(true)}>
                  Cancel purchase
                </Button>
                <Button type="button" isLoading={receivePurchase.isPending} onClick={() => setConfirmReceive(true)}>
                  Mark as received
                </Button>
              </div>
            )}
          </div>
        );
      })()}

      <ConfirmDialog
        open={confirmReceive}
        title="Receive purchase"
        message="This adds the received quantities into inventory at the receiving warehouse."
        confirmLabel="Mark as received"
        isConfirming={receivePurchase.isPending}
        onConfirm={handleReceive}
        onCancel={() => setConfirmReceive(false)}
      />

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel purchase"
        message="This cancels the purchase order. This can't be undone."
        confirmLabel="Cancel purchase"
        tone="danger"
        isConfirming={cancelPurchase.isPending}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
