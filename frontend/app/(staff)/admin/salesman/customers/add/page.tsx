"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { MapPinIcon } from "@/components/salesman/icons";
import { useCreateCustomer } from "@/lib/hooks/useCustomerMutations";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import type { CustomerCategory } from "@/types/customers";

const CATEGORY_OPTIONS: { value: CustomerCategory; label: string }[] = [
  { value: "retail", label: "Retail" },
  { value: "wholesale", label: "Wholesale" },
  { value: "distributor", label: "Distributor" },
];

function generateCustomerCode(): string {
  return `SM-${Date.now().toString(36).toUpperCase()}`;
}

export default function AddCustomerPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const createCustomer = useCreateCustomer();
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [values, setValues] = useState({
    business_name: "",
    owner_name: "",
    mobile: "",
    alternate_mobile: "",
    gst_number: "",
    pan_number: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    credit_limit: "0",
    payment_terms: "0",
    category: "retail" as CustomerCategory,
  });

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!values.business_name || !values.owner_name || !values.mobile || !values.address || !values.city || !values.state || !values.pincode) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      const customer = await createCustomer.mutateAsync({
        customer_code: generateCustomerCode(),
        business_name: values.business_name,
        owner_name: values.owner_name,
        mobile: values.mobile,
        alternate_mobile: values.alternate_mobile || null,
        gst_number: values.gst_number || null,
        pan_number: values.pan_number || null,
        address: values.address,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        credit_limit: Number(values.credit_limit) || 0,
        payment_terms: Number(values.payment_terms) || 0,
        category: values.category,
        latitude: location?.lat,
        longitude: location?.lng,
      });
      router.replace(`/admin/salesman/customers/${customer.id}`);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setError("A customer with this code already exists — please try again.");
      } else {
        setError("Something went wrong. Please check your connection and try again.");
      }
    }
  }

  return (
    <div>
      <SalesmanTopBar title="Add Customer" back hideAlerts />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 pb-8 sm:p-6">
        <Card className="flex flex-col gap-4 p-4">
          <p className="text-sm font-semibold text-ink">Business Details</p>
          <Input label="Customer / Shop Name *" value={values.business_name} onChange={(e) => set("business_name", e.target.value)} />
          <Input label="Owner Name *" value={values.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
          <Select
            label="Category"
            value={values.category}
            onValueChange={(v) => set("category", v as CustomerCategory)}
            options={CATEGORY_OPTIONS}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4">
          <p className="text-sm font-semibold text-ink">Contact</p>
          <Input label="Mobile *" type="tel" value={values.mobile} onChange={(e) => set("mobile", e.target.value)} />
          <Input label="Alternate Mobile" type="tel" value={values.alternate_mobile} onChange={(e) => set("alternate_mobile", e.target.value)} />
        </Card>

        <Card className="flex flex-col gap-4 p-4">
          <p className="text-sm font-semibold text-ink">Tax Details</p>
          <Input label="GST Number" value={values.gst_number} onChange={(e) => set("gst_number", e.target.value)} />
          <Input label="PAN Number" value={values.pan_number} onChange={(e) => set("pan_number", e.target.value)} />
        </Card>

        <Card className="flex flex-col gap-4 p-4">
          <p className="text-sm font-semibold text-ink">Address</p>
          <Input label="Address *" value={values.address} onChange={(e) => set("address", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City *" value={values.city} onChange={(e) => set("city", e.target.value)} />
            <Input label="State *" value={values.state} onChange={(e) => set("state", e.target.value)} />
          </div>
          <Input label="Pincode *" value={values.pincode} onChange={(e) => set("pincode", e.target.value)} />
          <button
            type="button"
            onClick={useCurrentLocation}
            className="flex items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-ink"
          >
            <MapPinIcon className="h-4 w-4" />
            {location ? "Location captured ✓" : "Use current location"}
          </button>
        </Card>

        <Card className="flex flex-col gap-4 p-4">
          <p className="text-sm font-semibold text-ink">Credit Terms</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Credit Limit (₹)" type="number" min="0" value={values.credit_limit} onChange={(e) => set("credit_limit", e.target.value)} />
            <Input label="Payment Terms (days)" type="number" min="0" value={values.payment_terms} onChange={(e) => set("payment_terms", e.target.value)} />
          </div>
        </Card>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <Button type="submit" isLoading={createCustomer.isPending} className="w-full">
          Save Customer
        </Button>
      </form>
    </div>
  );
}
