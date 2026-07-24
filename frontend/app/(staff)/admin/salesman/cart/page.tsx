"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { TrashIcon } from "@/components/salesman/icons";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useCart } from "@/components/salesman/CartContext";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatCurrency } from "@/lib/utils/format";

export default function CartPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const cart = useCart();
  const customer = useCustomer(cart.customerId ?? "");

  useEffect(() => {
    if (!cart.customerId || cart.lines.length === 0) {
      router.replace("/admin/salesman/customers?intent=take-order");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.customerId, cart.lines.length]);

  if (!cart.customerId || cart.lines.length === 0) return null;

  return (
    <div className="pb-32">
      <SalesmanTopBar title="Cart" subtitle={customer.data?.business_name} back hideAlerts />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <Card className="flex flex-col divide-y divide-border p-0">
          {cart.lines.map((line) => (
            <div key={line.product.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{line.product.name}</p>
                <p className="text-xs text-ink-muted">
                  {formatCurrency(line.product.effective_price)} · GST {line.product.gst_rate}%
                </p>
              </div>
              <QtyStepper
                size="sm"
                qty={line.qty}
                onChange={(qty) => {
                  if (qty <= 0) cart.removeItem(line.product.id);
                  else if (qty > line.qty) cart.incrementItem(line.product.id);
                  else cart.decrementItem(line.product.id);
                }}
              />
              <p className="w-20 shrink-0 text-right text-sm font-semibold text-ink">
                {formatCurrency(line.product.effective_price * line.qty)}
              </p>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => cart.removeItem(line.product.id)}
                className="shrink-0 text-danger"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Card>

        <Card className="flex flex-col gap-3 p-4">
          <label className="text-sm font-medium text-ink" htmlFor="notes">
            Notes
          </label>
          <textarea
            id="notes"
            rows={2}
            value={cart.remarks}
            onChange={(e) => cart.setRemarks(e.target.value)}
            placeholder="Any special instructions…"
            className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
          />
        </Card>

        <Card className="flex flex-col gap-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Subtotal</span>
            <span className="font-medium text-ink">{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">GST (estimated)</span>
            <span className="font-medium text-ink">{formatCurrency(cart.estimatedGst)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span className="text-ink">Grand Total</span>
            <span className="text-primary">{formatCurrency(cart.estimatedTotal)}</span>
          </div>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:static sm:mt-0 sm:bg-transparent sm:p-0 sm:px-6 sm:shadow-none">
        <Button className="w-full" onClick={() => router.push("/admin/salesman/summary")}>
          Proceed
        </Button>
      </div>
    </div>
  );
}
