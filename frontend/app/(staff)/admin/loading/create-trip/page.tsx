"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
import { useLoadableOrders } from "@/lib/hooks/useTrips";
import { useCreateTrip } from "@/lib/hooks/useTripMutations";
import { useTripDraft } from "@/components/loading/TripDraftContext";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { toDateInputValue } from "@/lib/utils/format";

export default function CreateTripPage() {
  useRoleGuard(["admin", "dispatcher", "manager"]);

  const router = useRouter();
  const draft = useTripDraft();
  const vehicles = useVehicles();
  const staff = useStaffDirectory();
  const loadableOrders = useLoadableOrders();
  const createTrip = useCreateTrip();

  const [tripDate, setTripDate] = useState(() => toDateInputValue());
  const [error, setError] = useState("");

  useEffect(() => {
    if (draft.orderIds.length === 0 || !draft.vehicleId || !draft.driverId) {
      router.replace("/admin/loading/orders");
    }
  }, [draft.orderIds.length, draft.vehicleId, draft.driverId, router]);

  if (draft.orderIds.length === 0 || !draft.vehicleId || !draft.driverId) return null;

  const vehicle = vehicles.data?.find((v) => v.id === draft.vehicleId);
  const driver = staff.data?.find((u) => u.id === draft.driverId);
  const selectedOrders = (loadableOrders.data ?? []).filter((o) => draft.orderIds.includes(o.id));
  const totalLc = selectedOrders.reduce((sum, o) => sum + o.lc_value, 0);
  const pct = vehicle ? (totalLc / vehicle.capacity) * 100 : 0;

  async function handleCreate() {
    setError("");
    try {
      const trip = await createTrip.mutateAsync({
        vehicle_id: draft.vehicleId!,
        driver_id: draft.driverId!,
        trip_date: tripDate ? new Date(tripDate).toISOString() : undefined,
        order_ids: draft.orderIds,
        remark: draft.remark || undefined,
      });
      draft.clear();
      router.replace(`/admin/loading/trips/${trip.id}`);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError(String(err.response.data?.detail ?? "This selection no longer fits the vehicle's capacity."));
      } else {
        setError("Something went wrong creating the trip. Please try again.");
      }
    }
  }

  return (
    <div className="pb-28">
      <AdminTopBar title="Create Trip" subtitle="Trip is created & assigned to driver" back />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <Card className="flex flex-col gap-2 p-4">
          <p className="text-xs font-medium text-ink-muted">Vehicle</p>
          <p className="text-sm font-semibold text-ink">{vehicle?.vehicle_number ?? "—"}</p>
          <p className="text-xs font-medium text-ink-muted">Driver</p>
          <p className="text-sm font-semibold text-ink">{driver?.full_name ?? "—"}</p>
        </Card>

        <Card className="p-4">
          <Input label="Trip Date" type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)} />
        </Card>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">Selected Orders ({selectedOrders.length})</h2>
          <Card className="flex flex-col divide-y divide-border p-0">
            {selectedOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-ink">{o.order_number}</span>
                <span className="font-medium text-ink">{o.lc_value.toFixed(2)} LC</span>
              </div>
            ))}
          </Card>
        </div>

        <Card className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Total Trip LC</span>
            <span className="font-semibold text-ink">
              {totalLc.toFixed(2)} / {vehicle?.capacity.toFixed(2)} LC ({pct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className={`h-full ${pct > 100 ? "bg-red-500" : pct > 90 ? "bg-orange-500" : "bg-primary"}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <label className="text-sm font-medium text-ink" htmlFor="remark">
            Remark (Optional)
          </label>
          <textarea
            id="remark"
            rows={2}
            value={draft.remark}
            onChange={(e) => draft.setRemark(e.target.value)}
            placeholder="Enter remark…"
            className="mt-1.5 w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
          />
        </Card>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:static sm:bg-transparent sm:p-0 sm:px-6">
        <Button className="w-full" isLoading={createTrip.isPending} onClick={handleCreate}>
          Create Trip
        </Button>
      </div>
    </div>
  );
}
