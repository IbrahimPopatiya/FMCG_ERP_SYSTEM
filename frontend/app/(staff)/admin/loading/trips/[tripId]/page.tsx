"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { isAxiosError } from "axios";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChevronRightIcon } from "@/components/admin/icons";
import { useTrip } from "@/lib/hooks/useTrips";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useStartTrip, useCompleteTrip, useCancelTrip } from "@/lib/hooks/useTripMutations";
import { getStaffRole } from "@/lib/auth/session";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import type { TripStatus } from "@/types/trips";

const STATUS_TONE: Record<TripStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  loading: "warning",
  out_for_delivery: "neutral",
  delivered: "success",
  cancelled: "danger",
};

export default function TripDetailPage() {
  useRoleGuard(["admin", "dispatcher", "manager", "driver"]);

  const router = useRouter();
  const { tripId } = useParams<{ tripId: string }>();
  const [tab, setTab] = useState<"orders" | "summary">("orders");
  const [error, setError] = useState("");

  const trip = useTrip(tripId);
  const vehicles = useVehicles();
  const staff = useStaffDirectory();
  const customers = useCustomers(200);
  const startTrip = useStartTrip(tripId);
  const completeTrip = useCompleteTrip(tripId);
  const cancelTrip = useCancelTrip(tripId);

  const isDriver = getStaffRole() === "driver";

  if (trip.isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!trip.data) {
    return (
      <div>
        <AdminTopBar title="Trip" back />
        <p className="p-6 text-sm text-ink-muted">Trip not found.</p>
      </div>
    );
  }

  const t = trip.data;
  const vehicle = vehicles.data?.find((v) => v.id === t.vehicle_id);
  const driver = staff.data?.find((u) => u.id === t.driver_id);
  const customerName = (id: string) => customers.data?.items.find((c) => c.id === id)?.business_name ?? "Customer";

  const allLoaded = t.orders.every((o) => o.order_status === "loaded");

  async function handleStart() {
    setError("");
    try {
      await startTrip.mutateAsync();
    } catch {
      setError("Couldn't start loading. Please try again.");
    }
  }

  async function handleComplete() {
    setError("");
    try {
      await completeTrip.mutateAsync();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError(String(err.response.data?.detail ?? "Not all orders are loaded yet."));
      } else {
        setError("Couldn't complete loading. Please try again.");
      }
    }
  }

  return (
    <div className="pb-8">
      <AdminTopBar title={t.trip_number} subtitle={`Status: ${t.status.replace(/_/g, " ")}`} back />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex justify-end">
          <Badge tone={STATUS_TONE[t.status]}>{t.status.replace(/_/g, " ")}</Badge>
        </div>

        {t.status === "out_for_delivery" && (
          <Card className="flex flex-col items-center gap-2 p-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-3xl text-primary">
              ✓
            </span>
            <p className="text-base font-semibold text-ink">Loading Completed Successfully</p>
            <p className="text-sm text-ink-muted">Order status updated to Out for Delivery</p>
            <p className="mt-1 text-lg font-semibold text-primary">{t.total_lc.toFixed(2)} LC Loaded</p>
            {isDriver && (
              <Link href="/admin/deliveries" className="mt-2 w-full">
                <Button className="w-full">Start Delivery</Button>
              </Link>
            )}
          </Card>
        )}

        {!isDriver && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("orders")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                tab === "orders" ? "bg-primary text-white" : "bg-surface text-ink-muted"
              }`}
            >
              Orders ({t.orders.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("summary")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                tab === "summary" ? "bg-primary text-white" : "bg-surface text-ink-muted"
              }`}
            >
              Summary
            </button>
          </div>
        )}

        {(tab === "orders" || isDriver) && (
          <Card className="flex flex-col divide-y divide-border p-0">
            {t.orders.map((order) => (
              <div key={order.sales_order_id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{customerName(order.customer_id)}</p>
                  <p className="text-xs text-ink-muted">
                    {order.order_number} · LC: {order.lc_value.toFixed(2)}
                  </p>
                </div>
                {t.status === "loading" ? (
                  <Link
                    href={`/admin/loading/trips/${t.id}/orders/${order.sales_order_id}`}
                    className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary"
                  >
                    {order.order_status === "loaded" && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                        ✓
                      </span>
                    )}
                    View Items <ChevronRightIcon className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <Badge tone={order.order_status === "loaded" ? "success" : "neutral"}>
                    {order.order_status}
                  </Badge>
                )}
              </div>
            ))}
          </Card>
        )}

        {tab === "summary" && !isDriver && (
          <Card className="flex flex-col gap-3 p-4">
            <div>
              <p className="text-xs font-medium text-ink-muted">Vehicle</p>
              <p className="text-sm font-semibold text-ink">{vehicle?.vehicle_number ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted">Driver</p>
              <p className="text-sm font-semibold text-ink">{driver?.full_name ?? "—"}</p>
              {driver?.mobile && <p className="text-xs text-ink-muted">{driver.mobile}</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted">Total LC</p>
              <p className="text-sm font-semibold text-ink">{t.total_lc.toFixed(2)}</p>
            </div>
            {t.remark && (
              <div>
                <p className="text-xs font-medium text-ink-muted">Remark</p>
                <p className="text-sm text-ink">{t.remark}</p>
              </div>
            )}
          </Card>
        )}

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        {!isDriver && t.status === "pending" && (
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => cancelTrip.mutate()}>
              Cancel Trip
            </Button>
            <Button className="flex-1" isLoading={startTrip.isPending} onClick={handleStart}>
              Start Loading
            </Button>
          </div>
        )}

        {!isDriver && t.status === "loading" && (
          <Button className="w-full" isLoading={completeTrip.isPending} disabled={!allLoaded} onClick={handleComplete}>
            {allLoaded ? "Done Loading" : "Load all orders to continue"}
          </Button>
        )}
      </div>

      {!isDriver && t.status === "loading" && (
        <div className="px-4 pb-2 sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/admin/loading/trips")}
            className="text-sm font-medium text-primary"
          >
            Back to Trip List
          </button>
        </div>
      )}
    </div>
  );
}
