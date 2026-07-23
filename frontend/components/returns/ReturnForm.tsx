"use client";

import { SubmitEvent, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useInvoiceSample } from "@/lib/hooks/useInvoices";
import { useOrder } from "@/lib/hooks/useOrders";
import { useProducts } from "@/lib/hooks/useProducts";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import { formatCurrency } from "@/lib/utils/format";
import type { ReturnCreate, ReturnReason } from "@/types/returns";

const REASON_OPTIONS: { value: ReturnReason; label: string }[] = [
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "wrong_item", label: "Wrong item" },
  { value: "not_needed", label: "Not needed" },
];

function submitErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 404) {
    return "That invoice could not be found.";
  }
  return "Something went wrong recording this return. Please try again.";
}

interface ReturnFormProps {
  onSubmit: (payload: ReturnCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function ReturnForm({ onSubmit, onSuccess }: ReturnFormProps) {
  const invoices = useInvoiceSample();
  const warehouses = useWarehouses();
  const products = useProducts();

  const [invoiceId, setInvoiceId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [reason, setReason] = useState<ReturnReason>("damaged");
  const [remarks, setRemarks] = useState("");
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedInvoice = invoices.data?.items.find((inv) => inv.id === invoiceId);
  const order = useOrder(selectedInvoice?.sales_order_id ?? "");

  const productName = (productId: string) =>
    products.data?.find((p) => p.id === productId)?.name ?? "Product";

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!invoiceId || !warehouseId) {
      setError("Choose an invoice and a warehouse.");
      return;
    }
    const items = Object.entries(qtyByProduct)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([productId, qty]) => ({ product_id: productId, quantity: Number(qty), reason }));

    if (items.length === 0) {
      setError("Enter a quantity for at least one item.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        invoice_id: invoiceId,
        warehouse_id: warehouseId,
        reason,
        remarks: remarks.trim() || null,
        items,
      });
      setInvoiceId("");
      setWarehouseId("");
      setRemarks("");
      setQtyByProduct({});
      onSuccess();
    } catch (err) {
      setError(submitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1" noValidate>
      <Select
        id="invoice_id"
        label="Invoice"
        value={invoiceId}
        onValueChange={(v) => {
          setInvoiceId(v);
          setQtyByProduct({});
        }}
        placeholder={invoices.isLoading ? "Loading invoices…" : "Select an invoice"}
        options={(invoices.data?.items ?? []).map((inv) => ({
          value: inv.id,
          label: `${inv.invoice_number} · ${formatCurrency(inv.total)}`,
        }))}
      />

      <Select
        id="warehouse_id"
        label="Return to warehouse"
        value={warehouseId}
        onValueChange={setWarehouseId}
        placeholder={warehouses.isLoading ? "Loading warehouses…" : "Select a warehouse"}
        options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
      />

      <Select
        id="reason"
        label="Reason"
        value={reason}
        onValueChange={(v) => setReason(v as ReturnReason)}
        options={REASON_OPTIONS}
      />

      <Input
        id="remarks"
        label="Remarks (optional)"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
      />

      {invoiceId && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink">Items to return</p>
          {order.isLoading && <p className="text-xs text-ink-muted">Loading order items…</p>}
          {!order.isLoading && (order.data?.items.length ?? 0) === 0 && (
            <p className="text-xs text-ink-muted">This order has no items.</p>
          )}
          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {order.data?.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{productName(item.product_id)}</p>
                  <p className="text-xs text-ink-muted">Ordered {item.ordered_qty}</p>
                </div>
                <input
                  type="number"
                  min="0"
                  max={item.ordered_qty}
                  step="0.01"
                  placeholder="0"
                  value={qtyByProduct[item.product_id] ?? ""}
                  onChange={(e) =>
                    setQtyByProduct((prev) => ({ ...prev, [item.product_id]: e.target.value }))
                  }
                  className="h-9 w-20 rounded-lg border border-border px-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Request return
        </Button>
      </div>
    </form>
  );
}
