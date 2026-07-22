"use client";

import { SubmitEvent, useState } from "react";
import { useParams } from "next/navigation";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { DeliveryStatusBadge } from "@/components/deliveries/DeliveryStatusBadge";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useDelivery } from "@/lib/hooks/useDeliveries";
import { useCompleteDelivery, useFailDelivery, useStartDelivery } from "@/lib/hooks/useDeliveryMutations";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { formatDate } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

function actionErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "This delivery's status changed since you loaded this page. Refresh and try again.";
  }
  return "Something went wrong. Please try again.";
}

function CompleteDeliveryModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (cash: number, upi: number, remarks: string) => Promise<unknown>;
  isSubmitting: boolean;
}) {
  const [cash, setCash] = useState("0");
  const [upi, setUpi] = useState("0");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit(Number(cash || 0), Number(upi || 0), remarks.trim());
    } catch (err) {
      setError(actionErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Complete delivery">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <p className="text-sm text-ink-muted">Record what was collected on delivery.</p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="cash_received"
            label="Cash received (₹)"
            type="number"
            min="0"
            step="0.01"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
          <Input
            id="upi_received"
            label="UPI received (₹)"
            type="number"
            min="0"
            step="0.01"
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
          />
        </div>
        <Input
          id="complete_remarks"
          label="Remarks (optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        {error && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Mark delivered
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FailDeliveryModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<unknown>;
  isSubmitting: boolean;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!reason.trim()) {
      setError("Tell us why the delivery failed.");
      return;
    }
    setError(null);
    try {
      await onSubmit(reason.trim());
    } catch (err) {
      setError(actionErrorMessage(err));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mark delivery as failed">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          id="fail_reason"
          label="Reason"
          placeholder="e.g. Shop closed, customer unreachable"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        {error && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={isSubmitting}>
            Mark as failed
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DeliveryDetailPage() {
  useRoleGuard(["admin", "driver", "manager", "dispatcher"]);

  const { deliveryId } = useParams<{ deliveryId: string }>();
  const delivery = useDelivery(deliveryId);
  const customer = useCustomer(delivery.data?.customer_id ?? "");
  const vehicles = useVehicles();
  const drivers = useStaffDirectory();
  const startDelivery = useStartDelivery(deliveryId);
  const completeDelivery = useCompleteDelivery(deliveryId);
  const failDelivery = useFailDelivery(deliveryId);

  const [actionError, setActionError] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [showFail, setShowFail] = useState(false);

  const vehicleNumber = (id: string | null) =>
    id ? vehicles.data?.find((v) => v.id === id)?.vehicle_number ?? "—" : "Not assigned";
  const driverName = (id: string | null) =>
    id ? drivers.data?.find((u) => u.id === id)?.full_name ?? "—" : "Not assigned";

  async function handleStart() {
    setActionError(null);
    try {
      await startDelivery.mutateAsync();
    } catch (err) {
      setActionError(actionErrorMessage(err));
    }
  }

  return (
    <div>
      <TopBar title="Delivery" />

      {delivery.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {delivery.isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this delivery.
          </div>
        </div>
      )}

      {delivery.data && (
        <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs font-medium text-ink-muted">{delivery.data.invoice_number}</p>
              <h1 className="mt-1 text-lg font-semibold text-ink">
                {customer.data?.business_name ?? "Loading customer…"}
              </h1>
              <p className="mt-0.5 text-sm text-ink-muted">Order {delivery.data.order_number}</p>
            </div>
            <DeliveryStatusBadge status={delivery.data.status} />
          </Card>

          <div className="divide-y divide-border rounded-lg border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-ink-muted">Vehicle</span>
              <span className="text-sm font-medium text-ink">{vehicleNumber(delivery.data.vehicle_id)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-ink-muted">Driver</span>
              <span className="text-sm font-medium text-ink">{driverName(delivery.data.driver_id)}</span>
            </div>
          </div>

          <div className="divide-y divide-border rounded-lg border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-ink-muted">Departed</span>
              <span className="text-sm font-medium text-ink">
                {delivery.data.departure_time ? formatDate(delivery.data.departure_time) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-ink-muted">Completed</span>
              <span className="text-sm font-medium text-ink">
                {delivery.data.completion_time ? formatDate(delivery.data.completion_time) : "—"}
              </span>
            </div>
          </div>

          {delivery.data.remarks && (
            <Card>
              <p className="text-xs font-medium text-ink-muted">Remarks</p>
              <p className="mt-1 text-sm text-ink">{delivery.data.remarks}</p>
            </Card>
          )}

          {actionError && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {actionError}
            </div>
          )}

          {delivery.data.status === "pending" && (
            <div className="flex justify-end">
              <Button type="button" isLoading={startDelivery.isPending} onClick={handleStart}>
                Start delivery
              </Button>
            </div>
          )}

          {delivery.data.status === "out_for_delivery" && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowFail(true)}>
                Mark as failed
              </Button>
              <Button type="button" onClick={() => setShowComplete(true)}>
                Complete delivery
              </Button>
            </div>
          )}
        </div>
      )}

      <CompleteDeliveryModal
        open={showComplete}
        onClose={() => setShowComplete(false)}
        isSubmitting={completeDelivery.isPending}
        onSubmit={async (cash, upi, remarks) => {
          // No GPS/location capture in this app (see UI_UX_REQUIREMENTS §3.2) -
          // the backend requires coordinates on complete, so we send a neutral
          // placeholder rather than prompting for a device permission.
          await completeDelivery.mutateAsync({
            status: "delivered",
            latitude: 0,
            longitude: 0,
            cash_received: cash,
            upi_received: upi,
            remarks: remarks || undefined,
          });
          setShowComplete(false);
        }}
      />

      <FailDeliveryModal
        open={showFail}
        onClose={() => setShowFail(false)}
        isSubmitting={failDelivery.isPending}
        onSubmit={async (reason) => {
          await failDelivery.mutateAsync(reason);
          setShowFail(false);
        }}
      />
    </div>
  );
}
