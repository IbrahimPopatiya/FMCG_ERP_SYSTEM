"use client";

import { SubmitEvent, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useProducts } from "@/lib/hooks/useProducts";
import { useSuppliers } from "@/lib/hooks/useSuppliers";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import type { PurchaseCreate } from "@/types/purchases";

interface ItemRow {
  key: number;
  productId: string;
  quantity: string;
  purchasePrice: string;
}

function emptyRow(key: number): ItemRow {
  return { key, productId: "", quantity: "", purchasePrice: "" };
}

function submitErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 404) {
    return "One of the selected products could not be found.";
  }
  return "Something went wrong creating this purchase. Please try again.";
}

interface PurchaseFormProps {
  onSubmit: (payload: PurchaseCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function PurchaseForm({ onSubmit, onSuccess }: PurchaseFormProps) {
  const suppliers = useSuppliers();
  const warehouses = useWarehouses();
  const products = useProducts();

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [rows, setRows] = useState<ItemRow[]>([emptyRow(0)]);
  const [nextKey, setNextKey] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(key: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(nextKey)]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!supplierId || !warehouseId) {
      setError("Choose a supplier and a warehouse.");
      return;
    }
    const items = rows
      .filter((row) => row.productId && Number(row.quantity) > 0 && Number(row.purchasePrice) > 0)
      .map((row) => ({
        product_id: row.productId,
        quantity: Number(row.quantity),
        purchase_price: Number(row.purchasePrice),
      }));

    if (items.length === 0) {
      setError("Add at least one item with a quantity and price.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ supplier_id: supplierId, warehouse_id: warehouseId, items });
      setSupplierId("");
      setWarehouseId("");
      setRows([emptyRow(0)]);
      setNextKey(1);
      onSuccess();
    } catch (err) {
      setError(submitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          id="supplier_id"
          label="Supplier"
          value={supplierId}
          onValueChange={setSupplierId}
          placeholder={suppliers.isLoading ? "Loading suppliers…" : "Select a supplier"}
          options={(suppliers.data ?? []).map((s) => ({ value: s.id, label: s.name }))}
        />
        <Select
          id="warehouse_id"
          label="Receiving warehouse"
          value={warehouseId}
          onValueChange={setWarehouseId}
          placeholder={warehouses.isLoading ? "Loading warehouses…" : "Select a warehouse"}
          options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-ink">Items</p>
        {rows.map((row) => (
          <div key={row.key} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Select
                id={`product-${row.key}`}
                label="Product"
                value={row.productId}
                onValueChange={(v) => updateRow(row.key, { productId: v })}
                placeholder={products.isLoading ? "Loading…" : "Select a product"}
                options={(products.data ?? []).map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
              />
            </div>
            <div className="flex gap-2">
              <div className="w-24">
                <label className="mb-1.5 block text-sm font-medium text-ink">Qty</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                  className="h-11 w-full rounded-lg border border-border px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />
              </div>
              <div className="w-28">
                <label className="mb-1.5 block text-sm font-medium text-ink">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.purchasePrice}
                  onChange={(e) => updateRow(row.key, { purchasePrice: e.target.value })}
                  className="h-11 w-full rounded-lg border border-border px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                disabled={rows.length === 1}
                aria-label="Remove item"
                className="mb-0.5 flex h-11 w-9 shrink-0 items-center justify-center self-end rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addRow} className="self-start">
          Add item
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Create purchase
        </Button>
      </div>
    </form>
  );
}
