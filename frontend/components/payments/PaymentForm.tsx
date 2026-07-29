"use client";

import { SubmitEvent, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useInvoiceSample } from "@/lib/hooks/useInvoices";
import { formatCurrency } from "@/lib/utils/format";
import type { PaymentCreate } from "@/types/payments";

function submitErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 404) {
    return "That invoice could not be found.";
  }
  if (isAxiosError(error) && error.response?.status === 422) {
    return "Enter at least one payment amount greater than zero.";
  }
  return "Something went wrong recording this payment. Please try again.";
}

interface PaymentFormProps {
  onSubmit: (payload: PaymentCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function PaymentForm({ onSubmit, onSuccess }: PaymentFormProps) {
  const invoices = useInvoiceSample();

  const [invoiceId, setInvoiceId] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [chequeAmount, setChequeAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payableInvoices = useMemo(
    () => (invoices.data?.items ?? []).filter((inv) => inv.payment_status !== "paid"),
    [invoices.data]
  );

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!invoiceId) {
      setError("Choose an invoice.");
      return;
    }
    const cash = Number(cashAmount || 0);
    const upi = Number(upiAmount || 0);
    const cheque = Number(chequeAmount || 0);
    if (cash <= 0 && upi <= 0 && cheque <= 0) {
      setError("Enter at least one payment amount greater than zero.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        invoice_id: invoiceId,
        cash_amount: cash,
        upi_amount: upi,
        cheque_amount: cheque,
        reference_number: referenceNumber.trim() || null,
      });
      setInvoiceId("");
      setCashAmount("");
      setUpiAmount("");
      setChequeAmount("");
      setReferenceNumber("");
      onSuccess();
    } catch (err) {
      setError(submitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Select
        id="invoice_id"
        label="Invoice"
        value={invoiceId}
        onValueChange={setInvoiceId}
        placeholder={invoices.isLoading ? "Loading invoices…" : "Select an invoice"}
        options={payableInvoices.map((inv) => ({
          value: inv.id,
          label: `${inv.invoice_number} · ${formatCurrency(inv.total)} · ${inv.payment_status}`,
        }))}
      />
      {!invoices.isLoading && payableInvoices.length === 0 && (
        <p className="text-xs text-ink-muted">No unpaid or partially paid invoices right now.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          id="cash_amount"
          label="Cash (₹)"
          type="number"
          min="0"
          step="0.01"
          value={cashAmount}
          onChange={(e) => setCashAmount(e.target.value)}
        />
        <Input
          id="upi_amount"
          label="UPI (₹)"
          type="number"
          min="0"
          step="0.01"
          value={upiAmount}
          onChange={(e) => setUpiAmount(e.target.value)}
        />
        <Input
          id="cheque_amount"
          label="Cheque (₹)"
          type="number"
          min="0"
          step="0.01"
          value={chequeAmount}
          onChange={(e) => setChequeAmount(e.target.value)}
        />
      </div>

      <Input
        id="reference_number"
        label="Reference number (optional)"
        placeholder="e.g. cheque number, UTR"
        value={referenceNumber}
        onChange={(e) => setReferenceNumber(e.target.value)}
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Record payment
        </Button>
      </div>
    </form>
  );
}
