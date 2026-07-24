"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useInvoice } from "@/lib/hooks/useInvoices";
import { useCustomerDuesById } from "@/lib/hooks/useCustomerDuesById";
import { useRecordPayment } from "@/lib/hooks/usePaymentMutations";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatCurrency } from "@/lib/utils/format";

type Method = "cash" | "upi" | "cheque";

export default function PaymentCollectionPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const { invoiceId } = useParams<{ invoiceId: string }>();

  const invoice = useInvoice(invoiceId);
  const dues = useCustomerDuesById(invoice.data?.customer_id ?? "");
  const recordPayment = useRecordPayment();

  const [method, setMethod] = useState<Method>("cash");
  const [amounts, setAmounts] = useState<Record<Method, string>>({ cash: "", upi: "", cheque: "" });
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const outstanding = useMemo(
    () => dues.data?.invoices.find((inv) => inv.invoice_id === invoiceId)?.balance ?? invoice.data?.total ?? 0,
    [dues.data, invoiceId, invoice.data]
  );

  const received = (Number(amounts.cash) || 0) + (Number(amounts.upi) || 0) + (Number(amounts.cheque) || 0);
  const remaining = Math.max(outstanding - received, 0);

  if (invoice.isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (success) {
    return (
      <div>
        <SalesmanTopBar title="Payment Collection" back hideAlerts />
        <div className="flex flex-col items-center gap-3 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-3xl text-primary">✓</span>
          <p className="text-base font-semibold text-ink">Payment recorded</p>
          <p className="text-sm text-ink-muted">Synced to the server. Cashier will verify and clear it shortly.</p>
          <Button onClick={() => router.push(`/admin/salesman/orders/${invoice.data?.sales_order_id}`)}>
            Back to Order
          </Button>
        </div>
      </div>
    );
  }

  async function handleSave() {
    setError("");
    if (received <= 0) {
      setError("Enter at least one payment amount.");
      return;
    }
    try {
      await recordPayment.mutateAsync({
        invoice_id: invoiceId,
        cash_amount: Number(amounts.cash) || 0,
        upi_amount: Number(amounts.upi) || 0,
        cheque_amount: Number(amounts.cheque) || 0,
        reference_number: reference || undefined,
      });
      setSuccess(true);
    } catch {
      setError("Something went wrong recording the payment. Please try again.");
    }
  }

  return (
    <div className="pb-8">
      <SalesmanTopBar title="Payment Collection" subtitle={invoice.data?.invoice_number} back hideAlerts />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <Card className="grid grid-cols-2 gap-4 p-4">
          <div>
            <p className="text-xs font-medium text-ink-muted">Invoice Amount</p>
            <p className="text-base font-semibold text-ink">{formatCurrency(invoice.data?.total ?? 0)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted">Outstanding</p>
            <p className="text-base font-semibold text-danger">{formatCurrency(outstanding)}</p>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold text-ink">Payment Method</p>
          <div className="grid grid-cols-3 gap-2">
            {(["cash", "upi", "cheque"] as Method[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-lg border py-2.5 text-xs font-semibold capitalize ${
                  method === m ? "border-primary bg-primary-soft text-primary" : "border-border text-ink-muted"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <Input
            label={`${method.charAt(0).toUpperCase() + method.slice(1)} Amount`}
            type="number"
            min="0"
            value={amounts[method]}
            onChange={(e) => setAmounts((prev) => ({ ...prev, [method]: e.target.value }))}
          />
          {method !== "cash" && (
            <Input
              label="Reference Number"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={method === "upi" ? "UPI transaction ID" : "Cheque number"}
            />
          )}
        </Card>

        <Card className="flex flex-col gap-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Received</span>
            <span className="font-medium text-ink">{formatCurrency(received)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span className="text-ink">Remaining</span>
            <span className={remaining > 0 ? "text-danger" : "text-primary"}>{formatCurrency(remaining)}</span>
          </div>
          {remaining > 0 && (
            <p className="text-[11px] text-ink-muted">
              The remaining balance stays on the customer&apos;s ledger as outstanding.
            </p>
          )}
        </Card>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <Button className="w-full" isLoading={recordPayment.isPending} onClick={handleSave}>
          Save Payment
        </Button>
      </div>
    </div>
  );
}
