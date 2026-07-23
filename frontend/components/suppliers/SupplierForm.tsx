"use client";

import { SubmitEvent, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SupplierCreate } from "@/types/suppliers";

interface SupplierFormValues {
  supplier_code: string;
  name: string;
  gst_number: string;
  mobile: string;
  address: string;
}

const EMPTY_FORM: SupplierFormValues = {
  supplier_code: "",
  name: "",
  gst_number: "",
  mobile: "",
  address: "",
};

function toPayload(values: SupplierFormValues): SupplierCreate {
  return {
    supplier_code: values.supplier_code.trim(),
    name: values.name.trim(),
    gst_number: values.gst_number.trim() || null,
    mobile: values.mobile.trim(),
    address: values.address.trim(),
  };
}

function submitErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "A supplier with this code already exists.";
  }
  return "Something went wrong saving this supplier. Please try again.";
}

interface SupplierFormProps {
  onSubmit: (payload: SupplierCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function SupplierForm({ onSubmit, onSuccess }: SupplierFormProps) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SupplierFormValues>(key: K, value: SupplierFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(toPayload(values));
      setValues(EMPTY_FORM);
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
        id="supplier_code"
        label="Supplier code"
        placeholder="e.g. SUP-101"
        value={values.supplier_code}
        onChange={(e) => set("supplier_code", e.target.value)}
        required
      />
      <Input
        id="name"
        label="Supplier name"
        value={values.name}
        onChange={(e) => set("name", e.target.value)}
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="mobile"
          label="Mobile"
          value={values.mobile}
          onChange={(e) => set("mobile", e.target.value)}
          required
        />
        <Input
          id="gst_number"
          label="GST number (optional)"
          value={values.gst_number}
          onChange={(e) => set("gst_number", e.target.value)}
        />
      </div>
      <Input
        id="address"
        label="Address"
        value={values.address}
        onChange={(e) => set("address", e.target.value)}
        required
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Add supplier
        </Button>
      </div>
    </form>
  );
}
