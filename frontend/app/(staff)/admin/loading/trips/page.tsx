"use client";

import Link from "next/link";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTrips } from "@/lib/hooks/useTrips";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
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

export default function TripsListPage() {
  useRoleGuard(["admin", "dispatcher", "manager", "driver"]);

  const trips = useTrips();
  const vehicles = useVehicles();
  const staff = useStaffDirectory();
  const isDriver = getStaffRole() === "driver";

  const vehicleNumber = (id: string) => vehicles.data?.find((v) => v.id === id)?.vehicle_number ?? "—";
  const driverName = (id: string) => staff.data?.find((u) => u.id === id)?.full_name ?? "—";

  const upcoming = (trips.data ?? []).filter((t) => t.status === "pending");
  const inProgress = (trips.data ?? []).filter((t) => t.status === "loading" || t.status === "out_for_delivery");
  const completed = (trips.data ?? []).filter((t) => t.status === "delivered" || t.status === "cancelled");

  return (
    <div>
      <AdminTopBar title={isDriver ? "My Trips" : "Trips"} back />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {trips.isLoading && (
          <>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </>
        )}

        {!trips.isLoading && (trips.data ?? []).length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No trips yet.</p>
        )}

        {inProgress.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">In Progress ({inProgress.length})</h2>
            <div className="flex flex-col gap-2">
              {inProgress.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  vehicleNumber={vehicleNumber(trip.vehicle_id)}
                  driverName={driverName(trip.driver_id)}
                />
              ))}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">Upcoming ({upcoming.length})</h2>
            <div className="flex flex-col gap-2">
              {upcoming.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  vehicleNumber={vehicleNumber(trip.vehicle_id)}
                  driverName={driverName(trip.driver_id)}
                />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink">Completed ({completed.length})</h2>
            <div className="flex flex-col gap-2">
              {completed.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  vehicleNumber={vehicleNumber(trip.vehicle_id)}
                  driverName={driverName(trip.driver_id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function TripCard({
  trip,
  vehicleNumber,
  driverName,
}: {
  trip: { id: string; trip_number: string; status: TripStatus; total_lc: number; orders: unknown[] };
  vehicleNumber: string;
  driverName: string;
}) {
  return (
    <Link href={`/admin/loading/trips/${trip.id}`}>
      <Card className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{trip.trip_number}</p>
          <p className="text-xs text-ink-muted">
            {vehicleNumber} · {driverName}
          </p>
          <p className="text-xs text-ink-muted">
            {trip.orders.length} order{trip.orders.length === 1 ? "" : "s"} · {trip.total_lc.toFixed(2)} LC
          </p>
        </div>
        <Badge tone={STATUS_TONE[trip.status]}>{trip.status.replace(/_/g, " ")}</Badge>
      </Card>
    </Link>
  );
}
