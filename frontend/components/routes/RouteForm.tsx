"use client";

import { SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { RouteCreate } from "@/types/salesRoutes";
import type { UserResponse } from "@/types/users";

interface RouteFormProps {
  salesmen: UserResponse[];
  onSubmit: (payload: RouteCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function RouteForm({ salesmen, onSubmit, onSuccess }: RouteFormProps) {
  const [name, setName] = useState("");
  const [salesmanId, setSalesmanId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), salesman_id: salesmanId || null });
      setName("");
      setSalesmanId("");
      onSuccess();
    } catch {
      setError("Something went wrong saving this route. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input id="name" label="Route name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Select
        id="salesman_id"
        label="Salesman (optional)"
        value={salesmanId}
        onValueChange={setSalesmanId}
        placeholder="Unassigned"
        options={salesmen.map((s) => ({ value: s.id, label: s.full_name }))}
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Add route
        </Button>
      </div>
    </form>
  );
}
