"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useCreateOrder } from "@/lib/hooks/useOrderMutations";
import { useCart } from "@/components/salesman/CartContext";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatCurrency, toDateInputValue } from "@/lib/utils/format";

export default function OrderSummaryPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const cart = useCart();
  const customer = useCustomer(cart.customerId ?? "");
  const createOrder = useCreateOrder();
  const [error, setError] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(cart.expectedDelivery || toDateInputValue());

  useEffect(() => {
    if (!cart.customerId || cart.lines.length === 0) {
      router.replace("/admin/salesman/customers?intent=take-order");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.customerId, cart.lines.length]);

  if (!cart.customerId || cart.lines.length === 0) return null;

  async function handleConfirm() {
    setError("");
    try {
      const order = await createOrder.mutateAsync({
        customer_id: cart.customerId!,
        remarks: cart.remarks || undefined,
        expected_delivery: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        items: cart.lines.map((l) => ({ product_id: l.product.id, ordered_qty: l.qty })),
      });
      cart.clearCart();
      router.replace(`/admin/salesman/orders/${order.id}?justPlaced=1`);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        setError("You may only place orders for customers on your own route.");
      } else if (isAxiosError(err) && err.response?.status === 409) {
        setError("No warehouse is currently available to fulfil this order.");
      } else {
        setError("Something went wrong placing the order. Please try again.");
      }
    }
  }

  return (
    <div className="pb-28">
      <SalesmanTopBar title="Order Summary" subtitle={customer.data?.business_name} back hideAlerts />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-sm font-semibold text-ink">{customer.data?.business_name}</p>
          <p className="text-xs text-ink-muted">{customer.data?.address}</p>
        </Card>

        <Card className="flex flex-col divide-y divide-border p-0">
          {cart.lines.map((line) => (
            <div key={line.product.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate text-ink">
                {line.product.name} × {line.qty}
              </span>
              <span className="shrink-0 font-medium text-ink">
                {formatCurrency(line.product.effective_price * line.qty)}
              </span>
            </div>
          ))}
        </Card>

        <Card className="p-4">
          <Input
            label="Expected Delivery Date"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
        </Card>

        {cart.remarks && (
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-muted">Notes</p>
            <p className="text-sm text-ink">{cart.remarks}</p>
          </Card>
        )}

        <Card className="flex flex-col gap-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Subtotal</span>
            <span className="font-medium text-ink">{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">GST (estimated)</span>
            <span className="font-medium text-ink">{formatCurrency(cart.estimatedGst)}</span>
          </div>
          <p className="text-[11px] text-ink-muted">
            Final GST split (CGST/SGST/IGST) and rounding are computed by the server on confirm.
          </p>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span className="text-ink">Grand Total</span>
            <span className="text-primary">{formatCurrency(cart.estimatedTotal)}</span>
          </div>
        </Card>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 flex gap-3 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:static sm:bg-transparent sm:p-0 sm:px-6 sm:shadow-none">
        <Button variant="secondary" className="flex-1" onClick={() => router.back()}>
          Edit
        </Button>
        <Button className="flex-1" isLoading={createOrder.isPending} onClick={handleConfirm}>
          Confirm Order
        </Button>
      </div>
    </div>
  );
}
