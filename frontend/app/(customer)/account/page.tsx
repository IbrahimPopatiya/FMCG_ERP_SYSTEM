"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { clearSession } from "@/lib/auth/session";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";
import { formatCurrency } from "@/lib/utils/format";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const customer = useCurrentCustomer();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/login");
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Account</h1>
      </header>

      {customer.isLoading && (
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {customer.isError && (
        <div className="p-4">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load your account details.
          </div>
        </div>
      )}

      {customer.data && (
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
              {customer.data.business_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold text-ink">{customer.data.business_name}</p>
              <p className="text-sm text-ink-muted">{customer.data.owner_name}</p>
            </div>
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
              {customer.data.status === "active" ? "Active account" : customer.data.status}
            </span>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border bg-white">
            <Row label="Customer code" value={customer.data.customer_code} />
            <Row label="Mobile" value={customer.data.mobile} />
            {customer.data.alternate_mobile && (
              <Row label="Alternate mobile" value={customer.data.alternate_mobile} />
            )}
            {customer.data.gst_number && <Row label="GST number" value={customer.data.gst_number} />}
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-sm text-ink-muted">Address</p>
            <p className="mt-1 text-sm font-medium text-ink">
              {customer.data.address}, {customer.data.city}, {customer.data.state}{" "}
              {customer.data.pincode}
            </p>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border bg-white">
            <Row label="Credit limit" value={formatCurrency(customer.data.credit_limit)} />
            <Row label="Payment terms" value={`${customer.data.payment_terms} days`} />
          </div>

          <Button type="button" variant="secondary" className="w-full" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}
