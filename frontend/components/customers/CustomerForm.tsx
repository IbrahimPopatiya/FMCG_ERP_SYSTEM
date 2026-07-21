"use client";

import { SubmitEvent, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { CustomerCreate } from "@/types/customers";

interface CustomerFormValues {
  customer_code: string;
  business_name: string;
  owner_name: string;
  mobile: string;
  alternate_mobile: string;
  gst_number: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  credit_limit: string;
  payment_terms: string;
  password: string;
}

const EMPTY_FORM: CustomerFormValues = {
  customer_code: "",
  business_name: "",
  owner_name: "",
  mobile: "",
  alternate_mobile: "",
  gst_number: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  credit_limit: "",
  payment_terms: "",
  password: "",
};

function toPayload(values: CustomerFormValues): CustomerCreate {
  return {
    customer_code: values.customer_code.trim(),
    business_name: values.business_name.trim(),
    owner_name: values.owner_name.trim(),
    mobile: values.mobile.trim(),
    alternate_mobile: values.alternate_mobile.trim() || null,
    gst_number: values.gst_number.trim() || null,
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    pincode: values.pincode.trim(),
    credit_limit: Number(values.credit_limit || 0),
    payment_terms: Number(values.payment_terms || 0),
    password: values.password,
  };
}

function submitErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "A customer with this code or mobile already exists.";
  }
  return "Something went wrong saving this customer. Please try again.";
}

interface CustomerFormProps {
  onSubmit: (payload: CustomerCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function CustomerForm({ onSubmit, onSuccess }: CustomerFormProps) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) {
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
    <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto pr-1" noValidate>
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Identification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="customer_code"
            label="Customer code"
            placeholder="e.g. CUST-101"
            value={values.customer_code}
            onChange={(e) => set("customer_code", e.target.value)}
            required
          />
          <Input
            id="business_name"
            label="Business name"
            placeholder="e.g. Sharma General Store"
            value={values.business_name}
            onChange={(e) => set("business_name", e.target.value)}
            required
          />
          <Input
            id="owner_name"
            label="Owner name"
            value={values.owner_name}
            onChange={(e) => set("owner_name", e.target.value)}
            required
          />
          <Input
            id="gst_number"
            label="GST number (optional)"
            value={values.gst_number}
            onChange={(e) => set("gst_number", e.target.value)}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Contact</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="mobile"
            label="Mobile"
            value={values.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            required
          />
          <Input
            id="alternate_mobile"
            label="Alternate mobile (optional)"
            value={values.alternate_mobile}
            onChange={(e) => set("alternate_mobile", e.target.value)}
          />
          <Input
            id="password"
            label="Login password"
            type="password"
            value={values.password}
            onChange={(e) => set("password", e.target.value)}
            required
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Address</h2>
        <Input
          id="address"
          label="Address"
          value={values.address}
          onChange={(e) => set("address", e.target.value)}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            id="city"
            label="City"
            value={values.city}
            onChange={(e) => set("city", e.target.value)}
            required
          />
          <Input
            id="state"
            label="State"
            value={values.state}
            onChange={(e) => set("state", e.target.value)}
            required
          />
          <Input
            id="pincode"
            label="Pincode"
            value={values.pincode}
            onChange={(e) => set("pincode", e.target.value)}
            required
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Credit terms</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="credit_limit"
            label="Credit limit (₹)"
            type="number"
            min="0"
            step="0.01"
            value={values.credit_limit}
            onChange={(e) => set("credit_limit", e.target.value)}
            required
          />
          <Input
            id="payment_terms"
            label="Payment terms (days)"
            type="number"
            min="0"
            step="1"
            value={values.payment_terms}
            onChange={(e) => set("payment_terms", e.target.value)}
            required
          />
        </div>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Add customer
        </Button>
      </div>
    </form>
  );
}
