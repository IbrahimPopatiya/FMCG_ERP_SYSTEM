"use client";

import { SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { WarehouseCreate } from "@/types/warehouses";

interface WarehouseFormValues {
  name: string;
  address: string;
  state: string;
}

const EMPTY_FORM: WarehouseFormValues = { name: "", address: "", state: "" };

interface WarehouseFormProps {
  onSubmit: (payload: WarehouseCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function WarehouseForm({ onSubmit, onSuccess }: WarehouseFormProps) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof WarehouseFormValues>(key: K, value: WarehouseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        address: values.address.trim(),
        state: values.state.trim(),
      });
      setValues(EMPTY_FORM);
      onSuccess();
    } catch {
      setError("Something went wrong saving this warehouse. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input id="name" label="Warehouse name" value={values.name} onChange={(e) => set("name", e.target.value)} required />
      <Input
        id="state"
        label="State"
        placeholder="Used to decide CGST+SGST vs IGST on orders"
        value={values.state}
        onChange={(e) => set("state", e.target.value)}
        required
      />
      <Input id="address" label="Address" value={values.address} onChange={(e) => set("address", e.target.value)} required />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Add warehouse
        </Button>
      </div>
    </form>
  );
}
