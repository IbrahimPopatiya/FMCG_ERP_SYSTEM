"use client";

import { SubmitEvent, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import type { VehicleCreate, VehicleResponse } from "@/types/vehicles";

function submitErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "A vehicle with this number already exists.";
  }
  return "Something went wrong saving this vehicle. Please try again.";
}

interface VehicleFormProps {
  vehicle?: VehicleResponse;
  onSubmit: (payload: VehicleCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function VehicleForm({ vehicle, onSubmit, onSuccess }: VehicleFormProps) {
  const isEditing = !!vehicle;
  const warehouses = useWarehouses();

  const [vehicleNumber, setVehicleNumber] = useState(vehicle?.vehicle_number ?? "");
  const [capacity, setCapacity] = useState(vehicle ? String(vehicle.capacity) : "");
  const [warehouseId, setWarehouseId] = useState(vehicle?.warehouse_id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        vehicle_number: vehicleNumber.trim(),
        capacity: Number(capacity || 0),
        warehouse_id: warehouseId || null,
      });
      if (!isEditing) {
        setVehicleNumber("");
        setCapacity("");
        setWarehouseId("");
      }
      onSuccess();
    } catch (err) {
      setError(submitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        id="vehicle_number"
        label="Vehicle number"
        placeholder="e.g. KA-05-AB-1234"
        value={vehicleNumber}
        onChange={(e) => setVehicleNumber(e.target.value)}
        required
      />
      <Input
        id="capacity"
        label="Capacity (tonnes)"
        type="number"
        min="0"
        step="0.01"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        required
      />
      <Select
        id="warehouse_id"
        label="Home warehouse (optional)"
        value={warehouseId || "none"}
        onValueChange={(v) => setWarehouseId(v === "none" ? "" : v)}
        options={[
          { value: "none", label: "Not assigned" },
          ...(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name })),
        ]}
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          {isEditing ? "Save changes" : "Add vehicle"}
        </Button>
      </div>
    </form>
  );
}
