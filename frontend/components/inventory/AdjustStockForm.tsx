"use client";

import { SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useProductStockList } from "@/lib/hooks/useProductStockList";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import type { InventoryAdjustmentCreate } from "@/types/inventory";

const DIRECTION_OPTIONS = [
  { value: "increase", label: "Increase stock" },
  { value: "decrease", label: "Decrease stock" },
];

interface AdjustStockFormProps {
  onSubmit: (payload: InventoryAdjustmentCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function AdjustStockForm({ onSubmit, onSuccess }: AdjustStockFormProps) {
  const warehouses = useWarehouses();
  const products = useProductStockList();

  const [warehouseId, setWarehouseId] = useState("");
  const [productId, setProductId] = useState("");
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const qty = Number(quantity);
    if (!warehouseId || !productId) {
      setError("Choose a warehouse and a product.");
      return;
    }
    if (!qty || qty <= 0) {
      setError("Enter a quantity greater than zero.");
      return;
    }
    if (!reason.trim()) {
      setError("Tell us why stock is being adjusted.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        warehouse_id: warehouseId,
        product_id: productId,
        quantity: direction === "increase" ? qty : -qty,
        reason: reason.trim(),
      });
      setWarehouseId("");
      setProductId("");
      setQuantity("");
      setReason("");
      onSuccess();
    } catch {
      setError("Something went wrong adjusting stock. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Select
        id="warehouse_id"
        label="Warehouse"
        value={warehouseId}
        onValueChange={setWarehouseId}
        placeholder={warehouses.isLoading ? "Loading warehouses…" : "Select a warehouse"}
        options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
      />
      <Select
        id="product_id"
        label="Product"
        value={productId}
        onValueChange={setProductId}
        placeholder={products.isLoading ? "Loading products…" : "Select a product"}
        options={(products.data?.items ?? []).map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          id="direction"
          label="Direction"
          value={direction}
          onValueChange={(v) => setDirection(v as "increase" | "decrease")}
          options={DIRECTION_OPTIONS}
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
      </div>
      <Input
        id="reason"
        label="Reason"
        placeholder="e.g. Stock count correction"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Adjust stock
        </Button>
      </div>
    </form>
  );
}
