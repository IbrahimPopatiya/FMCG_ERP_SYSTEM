"use client";

import Link from "next/link";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { BellIcon } from "@/components/admin/icons";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser, useStaffDirectory } from "@/lib/hooks/useUsers";
import { useOrders } from "@/lib/hooks/useOrders";
import { useLoadableOrders, useTrips } from "@/lib/hooks/useTrips";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { isSameDate, toDateInputValue } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import type { TripStatus } from "@/types/trips";

const STATUS_TONE: Record<TripStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  loading: "warning",
  out_for_delivery: "neutral",
  delivered: "success",
  cancelled: "danger",
};

function fmtLc(value: number): string {
  return `${value.toFixed(2)} LC`;
}

function SummaryTile({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: string;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      {isLoading ? <Skeleton className="h-6 w-16" /> : <p className="text-lg font-semibold text-ink">{value}</p>}
    </div>
  );
}

export default function LoadingDashboardPage() {
  useRoleGuard(["admin", "dispatcher", "manager"]);

  const currentUser = useCurrentUser();
  const orders = useOrders();
  const loadableOrders = useLoadableOrders();
  const trips = useTrips();
  const vehicles = useVehicles();
  const staff = useStaffDirectory();

  const today = toDateInputValue();
  const todaysOrders = (orders.data ?? []).filter((o) => isSameDate(o.created_at, today));
  const totalLc = todaysOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.ordered_qty, 0),
    0
  );

  const activeTrips = (trips.data ?? []).filter((t) => t.status === "pending" || t.status === "loading");
  const assignedLc = activeTrips.reduce((sum, t) => sum + t.total_lc, 0);
  const loadedLc = (trips.data ?? [])
    .filter((t) => t.status === "out_for_delivery" || t.status === "delivered")
    .reduce((sum, t) => sum + t.total_lc, 0);

  const pendingCount = loadableOrders.data?.length ?? 0;
  const loadingCount = (trips.data ?? []).filter((t) => t.status === "loading").reduce((s, t) => s + t.orders.length, 0);
  const outForDeliveryCount = (trips.data ?? [])
    .filter((t) => t.status === "out_for_delivery")
    .reduce((s, t) => s + t.orders.length, 0);
  const deliveredCount = (orders.data ?? []).filter((o) => o.status === "delivered").length;

  const todaysTrips = [...(trips.data ?? [])]
    .filter((t) => isSameDate(t.created_at, today))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const vehicleNumber = (id: string) => vehicles.data?.find((v) => v.id === id)?.vehicle_number ?? "—";
  const driverName = (id: string) => staff.data?.find((u) => u.id === id)?.full_name ?? "—";

  const isLoading = orders.isLoading || trips.isLoading;
  const firstName = currentUser.data?.full_name?.split(" ")[0];

  return (
    <div>
      <AdminTopBar
        title={firstName ? `Good Morning, ${firstName}` : "Loading Supervisor"}
        subtitle={new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "long" }).format(
          new Date()
        )}
        right={
          <span className="flex h-9 w-9 items-center justify-center rounded-full text-white/90">
            <BellIcon className="h-5 w-5" />
          </span>
        }
      />

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
        <Card className="p-4">
          <h2 className="mb-4 text-sm font-semibold text-ink">Today&apos;s Summary</h2>
          <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
            <SummaryTile label="Total Orders" value={String(todaysOrders.length)} isLoading={isLoading} />
            <SummaryTile label="Total LC" value={fmtLc(totalLc)} isLoading={isLoading} />
            <SummaryTile label="Assigned LC" value={fmtLc(assignedLc)} isLoading={isLoading} />
            <SummaryTile label="Loaded LC" value={fmtLc(loadedLc)} isLoading={isLoading} />
          </div>
        </Card>

        <div className="grid grid-cols-4 gap-3">
          <Link href="/admin/loading/orders">
            <Card className="flex flex-col items-center gap-1 p-3 text-center">
              <p className="text-lg font-semibold text-amber-600">{pendingCount}</p>
              <p className="text-[11px] text-ink-muted">Pending</p>
            </Card>
          </Link>
          <Link href="/admin/loading/trips">
            <Card className="flex flex-col items-center gap-1 p-3 text-center">
              <p className="text-lg font-semibold text-amber-600">{loadingCount}</p>
              <p className="text-[11px] text-ink-muted">Loading</p>
            </Card>
          </Link>
          <Link href="/admin/loading/trips">
            <Card className="flex flex-col items-center gap-1 p-3 text-center">
              <p className="text-lg font-semibold text-ink">{outForDeliveryCount}</p>
              <p className="text-[11px] text-ink-muted">Out for Delivery</p>
            </Card>
          </Link>
          <Card className="flex flex-col items-center gap-1 p-3 text-center">
            <p className="text-lg font-semibold text-primary">{deliveredCount}</p>
            <p className="text-[11px] text-ink-muted">Delivered</p>
          </Card>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Today&apos;s Trips</h2>
            <Link href="/admin/loading/trips" className="text-xs font-medium text-primary">
              View All
            </Link>
          </div>
          <Card className="flex flex-col divide-y divide-border p-0">
            {trips.isLoading && (
              <div className="p-4">
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            {!trips.isLoading && todaysTrips.length === 0 && (
              <p className="p-4 text-sm text-ink-muted">No trips created today yet.</p>
            )}
            {todaysTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/admin/loading/trips/${trip.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{vehicleNumber(trip.vehicle_id)}</p>
                  <p className="text-xs text-ink-muted">
                    Driver {driverName(trip.driver_id)} · {fmtLc(trip.total_lc)}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[trip.status]}>{trip.status.replace(/_/g, " ")}</Badge>
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
