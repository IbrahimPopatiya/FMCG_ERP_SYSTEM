"use client";

import { SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useProductStockList } from "@/lib/hooks/useProductStockList";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import type { InventoryTransferCreate } from "@/types/inventory";

interface TransferStockFormProps {
  onSubmit: (payload: InventoryTransferCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function TransferStockForm({ onSubmit, onSuccess }: TransferStockFormProps) {
  const warehouses = useWarehouses();
  const products = useProductStockList();

  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const qty = Number(quantity);
    if (!fromWarehouseId || !toWarehouseId || !productId) {
      setError("Choose both warehouses and a product.");
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      setError("Choose two different warehouses.");
      return;
    }
    if (!qty || qty <= 0) {
      setError("Enter a quantity greater than zero.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        product_id: productId,
        quantity: qty,
      });
      setFromWarehouseId("");
      setToWarehouseId("");
      setProductId("");
      setQuantity("");
      onSuccess();
    } catch {
      setError("Something went wrong transferring stock. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const warehouseOptions = (warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          id="from_warehouse_id"
          label="From warehouse"
          value={fromWarehouseId}
          onValueChange={setFromWarehouseId}
          placeholder={warehouses.isLoading ? "Loading…" : "Select a warehouse"}
          options={warehouseOptions}
        />
        <Select
          id="to_warehouse_id"
          label="To warehouse"
          value={toWarehouseId}
          onValueChange={setToWarehouseId}
          placeholder={warehouses.isLoading ? "Loading…" : "Select a warehouse"}
          options={warehouseOptions}
        />
      </div>
      <Select
        id="product_id"
        label="Product"
        value={productId}
        onValueChange={setProductId}
        placeholder={products.isLoading ? "Loading products…" : "Select a product"}
        options={(products.data?.items ?? []).map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
      />
      <Input
        id="quantity"
        label="Quantity"
        type="number"
        min="1"
        step="1"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        required
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Transfer stock
        </Button>
      </div>
    </form>
  );
}
