"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Card } from "@/components/ui/Card";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { useLoadableOrders, useTrips } from "@/lib/hooks/useTrips";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
import { useTripDraft } from "@/components/loading/TripDraftContext";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

function gaugeColor(pct: number): string {
  if (pct > 100) return "bg-red-500";
  if (pct > 90) return "bg-orange-500";
  if (pct > 70) return "bg-amber-400";
  return "bg-primary";
}

export default function AssignVehiclePage() {
  useRoleGuard(["admin", "dispatcher", "manager"]);

  const router = useRouter();
  const draft = useTripDraft();
  const vehicles = useVehicles();
  const trips = useTrips();
  const loadableOrders = useLoadableOrders();
  const staff = useStaffDirectory();

  const driverName = (id: string | null) => (id ? staff.data?.find((u) => u.id === id)?.full_name ?? "—" : null);

  useEffect(() => {
    if (draft.orderIds.length === 0) router.replace("/admin/loading/orders");
  }, [draft.orderIds.length, router]);

  const selectedOrders = (loadableOrders.data ?? []).filter((o) => draft.orderIds.includes(o.id));
  const totalLc = selectedOrders.reduce((sum, o) => sum + o.lc_value, 0);

  const committedByVehicle = useMemo(() => {
    const map = new Map<string, number>();
    for (const trip of trips.data ?? []) {
      if (trip.status !== "pending" && trip.status !== "loading") continue;
      map.set(trip.vehicle_id, (map.get(trip.vehicle_id) ?? 0) + trip.total_lc);
    }
    return map;
  }, [trips.data]);

  if (draft.orderIds.length === 0) return null;

  return (
    <div className="pb-24">
      <AdminTopBar title="Select Vehicle" subtitle={`Selected Orders (${selectedOrders.length})`} back />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <Card className="flex items-center justify-between p-4">
          <p className="text-sm font-medium text-ink">Total LC</p>
          <p className="text-lg font-semibold text-primary">{totalLc.toFixed(2)}</p>
        </Card>

        <h2 className="text-sm font-semibold text-ink">Available Vehicles</h2>
        <div className="flex flex-col gap-3">
          {vehicles.isLoading && <p className="text-sm text-ink-muted">Loading vehicles…</p>}
          {!vehicles.isLoading && (vehicles.data ?? []).length === 0 && (
            <p className="text-sm text-ink-muted">No vehicles in the fleet yet.</p>
          )}
          {(vehicles.data ?? []).map((vehicle) => {
            const committed = committedByVehicle.get(vehicle.id) ?? 0;
            const available = vehicle.capacity - committed;
            const projectedPct = ((committed + totalLc) / vehicle.capacity) * 100;
            const selected = draft.vehicleId === vehicle.id;
            const overCapacity = totalLc > available;
            const noDriver = !vehicle.driver_id;
            const disabled = overCapacity || noDriver;

            function selectVehicle() {
              if (disabled || !vehicle.driver_id) return;
              draft.setVehicle(vehicle.id);
              draft.setDriver(vehicle.driver_id);
            }

            return (
              <Card
                key={vehicle.id}
                onClick={selectVehicle}
                className={`flex flex-col gap-2 ${selected ? "border-primary" : ""} ${
                  disabled ? "opacity-50" : "cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={selected}
                      disabled={disabled}
                      onChange={selectVehicle}
                      className="h-4 w-4 accent-primary"
                    />
                    <p className="text-sm font-semibold text-ink">{vehicle.vehicle_number}</p>
                  </div>
                  <span className="text-xs font-semibold text-ink">{Math.min(projectedPct, 999).toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full ${gaugeColor(projectedPct)}`}
                    style={{ width: `${Math.min(projectedPct, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-ink-muted">
                  Capacity: {vehicle.capacity.toFixed(2)} LC · Available: {available.toFixed(2)} LC
                  {vehicle.driver_id && ` · Driver: ${driverName(vehicle.driver_id)}`}
                </p>
                {overCapacity && <p className="text-xs font-medium text-danger">Not enough capacity for this selection</p>}
                {noDriver && <p className="text-xs font-medium text-danger">No driver assigned to this vehicle yet</p>}
              </Card>
            );
          })}
        </div>
      </div>

      {draft.vehicleId && (
        <div className="fixed inset-x-0 bottom-16 z-20 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:static sm:bg-transparent sm:p-0 sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/admin/loading/create-trip")}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white"
          >
            Assign to Vehicle
          </button>
        </div>
      )}
    </div>
  );
}
