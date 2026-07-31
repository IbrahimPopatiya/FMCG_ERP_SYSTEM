"use client";

import { SubmitEvent, useRef, useState } from "react";
import Image from "next/image";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PersonIcon, UploadCloudIcon } from "@/components/admin/icons";
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

// Note: the reference mockup shows a profile-photo upload and a Status
// toggle on this screen. The customer API (CustomerCreate) has no avatar or
// status field to save either to — a new customer is always created active
// — so the photo field below is a visual-only placeholder (no upload call
// is wired) rather than a control that silently does nothing.
export function CustomerForm({ onSubmit, onSuccess }: CustomerFormProps) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
    event.target.value = "";
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(toPayload(values));
      setValues(EMPTY_FORM);
      setPhotoPreview(null);
      onSuccess();
    } catch (err) {
      setError(submitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col gap-5 overflow-y-auto pr-1" noValidate>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface px-4 py-6 text-center transition-colors hover:border-primary"
      >
        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-primary">
          {photoPreview ? (
            <Image
              src={photoPreview}
              alt="Profile preview"
              fill
              sizes="48px"
              unoptimized={photoPreview.startsWith("blob:")}
              className="object-cover"
            />
          ) : (
            <PersonIcon className="h-6 w-6" />
          )}
        </div>
        <p className="text-sm font-semibold text-ink">Upload Profile Photo</p>
        <p className="text-xs text-ink-muted">JPG, PNG up to 2MB</p>
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />

      <Input
        id="business_name"
        label="Full Name"
        placeholder="Enter customer name"
        value={values.business_name}
        onChange={(e) => set("business_name", e.target.value)}
        required
      />
      <Input
        id="owner_name"
        label="Owner name"
        placeholder="Enter owner name"
        value={values.owner_name}
        onChange={(e) => set("owner_name", e.target.value)}
        required
      />
      <Input
        id="mobile"
        label="Mobile Number"
        placeholder="Enter mobile number"
        value={values.mobile}
        onChange={(e) => set("mobile", e.target.value)}
        required
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="address" className="text-sm font-medium text-ink">
          Address
        </label>
        <textarea
          id="address"
          placeholder="Enter full address"
          value={values.address}
          onChange={(e) => set("address", e.target.value)}
          rows={3}
          required
          className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input id="city" label="City" value={values.city} onChange={(e) => set("city", e.target.value)} required />
        <Input id="state" label="State" value={values.state} onChange={(e) => set("state", e.target.value)} required />
        <Input
          id="pincode"
          label="Pincode"
          value={values.pincode}
          onChange={(e) => set("pincode", e.target.value)}
          required
        />
      </div>

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
          id="gst_number"
          label="GST number (optional)"
          value={values.gst_number}
          onChange={(e) => set("gst_number", e.target.value)}
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

      <div className="flex items-center justify-between rounded-lg bg-surface px-4 py-3">
        <span className="text-sm font-medium text-ink">Status</span>
        <span className="flex items-center gap-2 text-sm text-ink-muted">
          Active
          <span className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
            <span className="ml-[1.375rem] inline-block h-4 w-4 rounded-full bg-white shadow" />
          </span>
        </span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full rounded-full">
          Save Customer
        </Button>
      </div>
    </form>
  );
}
