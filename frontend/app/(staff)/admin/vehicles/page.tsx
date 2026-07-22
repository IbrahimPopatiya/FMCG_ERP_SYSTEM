"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { VehicleStatusBadge } from "@/components/vehicles/VehicleStatusBadge";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
import { useVehicles } from "@/lib/hooks/useVehicles";
import {
  useAssignVehicleDriver,
  useCreateVehicle,
  useDeleteVehicle,
  useSetVehicleStatus,
} from "@/lib/hooks/useVehicleMutations";
import type { VehicleResponse, VehicleStatus } from "@/types/vehicles";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In use" },
  { value: "maintenance", label: "Maintenance" },
];

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M3 13l2-6h11l2 6M3 13v5h2m14-5v5h-2M5 18a2 2 0 104 0M15 18a2 2 0 104 0M5 13h14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-ink">No vehicles yet</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        Add the vehicles used for deliveries so they can be assigned to drivers.
      </p>
      <Button type="button" className="mt-1" onClick={onAdd}>
        Add vehicle
      </Button>
    </div>
  );
}

export default function VehiclesPage() {
  useRoleGuard(["admin", "driver", "manager", "dispatcher"]);

  const [isFormOpen, setFormOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<VehicleResponse | null>(null);

  const vehicles = useVehicles();
  const drivers = useStaffDirectory();
  const createVehicle = useCreateVehicle();
  const assignDriver = useAssignVehicleDriver();
  const setStatus = useSetVehicleStatus();
  const removeVehicle = useDeleteVehicle();

  const rows = vehicles.data ?? [];
  const driverOptions = (drivers.data ?? []).filter((u) => u.role === "driver");

  const driverName = (driverId: string | null) =>
    driverId ? driverOptions.find((d) => d.id === driverId)?.full_name ?? "—" : "Not assigned";

  function handleConfirmRemoval() {
    if (!pendingRemoval) return;
    removeVehicle.mutate(pendingRemoval.id, { onSuccess: () => setPendingRemoval(null) });
  }

  return (
    <div>
      <TopBar title="Vehicles" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Vehicles</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {rows.length > 0 ? `${rows.length} vehicle${rows.length === 1 ? "" : "s"}` : "The fleet used for deliveries"}
          </p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          Add vehicle
        </Button>
      </header>

      {vehicles.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {vehicles.isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load vehicles.
            <Button type="button" variant="secondary" onClick={() => vehicles.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!vehicles.isLoading && !vehicles.isError && rows.length === 0 && (
        <EmptyState onAdd={() => setFormOpen(true)} />
      )}

      {!vehicles.isLoading && !vehicles.isError && rows.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<VehicleResponse>
                rowKey={(v) => v.id}
                rows={rows}
                columns={[
                  {
                    header: "Vehicle",
                    render: (v) => (
                      <div>
                        <p className="font-medium text-ink">{v.vehicle_number}</p>
                        <p className="text-xs text-ink-muted">{v.capacity} tonnes</p>
                      </div>
                    ),
                  },
                  {
                    header: "Driver",
                    render: (v) => (
                      <div className="w-44">
                        <Select
                          value={v.driver_id ?? "none"}
                          onValueChange={(driverId) => {
                            if (driverId !== "none") assignDriver.mutate({ vehicleId: v.id, driverId });
                          }}
                          options={[
                            { value: "none", label: driverName(v.driver_id) },
                            ...driverOptions.map((d) => ({ value: d.id, label: d.full_name })),
                          ]}
                        />
                      </div>
                    ),
                  },
                  {
                    header: "Status",
                    render: (v) => (
                      <div className="w-40">
                        <Select
                          value={v.status}
                          onValueChange={(status) =>
                            setStatus.mutate({ vehicleId: v.id, status: status as VehicleStatus })
                          }
                          options={STATUS_OPTIONS}
                        />
                      </div>
                    ),
                  },
                  {
                    header: "",
                    render: (v) => (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="danger"
                          className="h-9 px-3 text-xs"
                          onClick={() => setPendingRemoval(v)}
                        >
                          Remove
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {rows.map((v) => (
              <Card key={v.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{v.vehicle_number}</p>
                    <p className="text-xs text-ink-muted">{v.capacity} tonnes · {driverName(v.driver_id)}</p>
                  </div>
                  <VehicleStatusBadge status={v.status} />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="danger"
                    className="h-9 px-3 text-xs"
                    onClick={() => setPendingRemoval(v)}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Add vehicle">
        <VehicleForm
          onSubmit={(payload) => createVehicle.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remove vehicle"
        message={pendingRemoval ? `Remove ${pendingRemoval.vehicle_number} from the fleet?` : ""}
        confirmLabel="Remove"
        tone="danger"
        isConfirming={removeVehicle.isPending}
        onConfirm={handleConfirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
}
