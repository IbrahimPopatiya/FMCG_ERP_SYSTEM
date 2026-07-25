"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
import { useDeliveriesManage } from "@/lib/hooks/useDeliveries";
import { formatDate } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import type { DeliveryStatus } from "@/types/deliveries";

const STATUS_TONE: Record<DeliveryStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "neutral",
  out_for_delivery: "warning",
  delivered: "success",
  failed: "danger",
};

// A "trip" here is every delivery stop assigned to this vehicle, grouped by
// day. The backend has no separate trip entity — no per-trip load quantity
// or loading-capacity fill % is tracked, so those design-mock fields are
// intentionally left out rather than fabricated. Vehicle capacity is shown
// as a static fact only.
export default function VehicleTripsPage() {
  useRoleGuard(["admin", "driver", "manager", "dispatcher"]);

  const { vehicleId } = useParams<{ vehicleId: string }>();
  const vehicles = useVehicles();
  const drivers = useStaffDirectory();
  const deliveries = useDeliveriesManage();

  const vehicle = vehicles.data?.find((v) => v.id === vehicleId);
  const driverName = (driverId: string | null) =>
    driverId ? drivers.data?.find((d) => d.id === driverId)?.full_name ?? "—" : "Unassigned";

  const allDeliveries = deliveries.data?.pages.flatMap((p) => p.items) ?? [];
  const vehicleDeliveries = useMemo(
    () => allDeliveries.filter((d) => d.vehicle_id === vehicleId),
    [allDeliveries, vehicleId]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, typeof vehicleDeliveries>();
    for (const d of vehicleDeliveries) {
      const key = formatDate(d.departure_time ?? d.completion_time ?? new Date().toISOString());
      map.set(key, [...(map.get(key) ?? []), d]);
    }
    return Array.from(map.entries());
  }, [vehicleDeliveries]);

  const completed = vehicleDeliveries.filter((d) => d.status === "delivered").length;
  const isLoading = vehicles.isLoading || deliveries.isLoading;

  return (
    <div>
      <AdminTopBar title={vehicle ? `Trips · ${vehicle.vehicle_number}` : "Trips"} back />

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
          <StatCard label="Vehicle" value={vehicle?.vehicle_number ?? "—"} isLoading={vehicles.isLoading} />
          <StatCard label="Capacity" value={vehicle ? `${vehicle.capacity} tonnes` : "—"} isLoading={vehicles.isLoading} />
          <StatCard label="Completed stops" value={String(completed)} isLoading={isLoading} tone="success" />
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && byDay.length === 0 && (
          <Card className="rounded-2xl text-center text-sm text-ink-muted">
            No deliveries have been assigned to this vehicle yet.
          </Card>
        )}

        {!isLoading &&
          byDay.map(([date, stops]) => (
            <div key={date}>
              <h2 className="mb-2 text-sm font-semibold text-ink">{date} · {stops.length} stop{stops.length === 1 ? "" : "s"}</h2>
              <div className="flex flex-col gap-2">
                {stops.map((d) => (
                  <Card key={d.id} className="flex items-center justify-between gap-3 rounded-2xl">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-ink-muted">{d.order_number}</p>
                      <p className="mt-0.5 text-sm text-ink">{driverName(d.driver_id)}</p>
                    </div>
                    <Badge tone={STATUS_TONE[d.status]}>{d.status.replace(/_/g, " ")}</Badge>
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
