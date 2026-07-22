"use client";

import { SubmitEvent, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useDeliverySample } from "@/lib/hooks/useDeliveries";
import { useInvoiceSample } from "@/lib/hooks/useInvoices";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { formatCurrency } from "@/lib/utils/format";
import type { DeliveryCreate } from "@/types/deliveries";

function submitErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "This invoice already has a delivery.";
  }
  if (isAxiosError(error) && error.response?.status === 404) {
    return "That invoice could not be found.";
  }
  return "Something went wrong creating this delivery. Please try again.";
}

interface DeliveryFormProps {
  onSubmit: (payload: DeliveryCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function DeliveryForm({ onSubmit, onSuccess }: DeliveryFormProps) {
  const invoices = useInvoiceSample();
  const deliveries = useDeliverySample();
  const vehicles = useVehicles();
  const drivers = useStaffDirectory();

  const [invoiceId, setInvoiceId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const undeliveredInvoices = useMemo(() => {
    const deliveredInvoiceIds = new Set((deliveries.data?.items ?? []).map((d) => d.invoice_id));
    return (invoices.data?.items ?? []).filter((inv) => !deliveredInvoiceIds.has(inv.id));
  }, [invoices.data, deliveries.data]);

  const driverOptions = (drivers.data ?? []).filter((u) => u.role === "driver");

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!invoiceId) {
      setError("Choose an invoice to deliver.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        invoice_id: invoiceId,
        vehicle_id: vehicleId || null,
        driver_id: driverId || null,
      });
      setInvoiceId("");
      setVehicleId("");
      setDriverId("");
      onSuccess();
    } catch (err) {
      setError(submitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoadingOptions = invoices.isLoading || deliveries.isLoading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Select
        id="invoice_id"
        label="Invoice"
        value={invoiceId}
        onValueChange={setInvoiceId}
        placeholder={isLoadingOptions ? "Loading invoices…" : "Select an invoice"}
        options={undeliveredInvoices.map((inv) => ({
          value: inv.id,
          label: `${inv.invoice_number} · ${formatCurrency(inv.total)}`,
        }))}
      />
      {!isLoadingOptions && undeliveredInvoices.length === 0 && (
        <p className="text-xs text-ink-muted">
          No invoices are waiting on a delivery right now.
        </p>
      )}

      <Select
        id="vehicle_id"
        label="Vehicle (optional)"
        value={vehicleId || "none"}
        onValueChange={(v) => setVehicleId(v === "none" ? "" : v)}
        options={[
          { value: "none", label: "Assign later" },
          ...(vehicles.data?.map((v) => ({ value: v.id, label: v.vehicle_number })) ?? []),
        ]}
      />

      <Select
        id="driver_id"
        label="Driver (optional)"
        value={driverId || "none"}
        onValueChange={(v) => setDriverId(v === "none" ? "" : v)}
        options={[
          { value: "none", label: "Assign later" },
          ...driverOptions.map((d) => ({ value: d.id, label: d.full_name })),
        ]}
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Create delivery
        </Button>
      </div>
    </form>
  );
}
