"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useSetCustomerStatus } from "@/lib/hooks/useCustomerMutations";
import { formatCurrency } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export default function CustomerDetailPage() {
  useRoleGuard(["admin", "salesman", "manager", "cashier"]);

  const { customerId } = useParams<{ customerId: string }>();
  const customer = useCustomer(customerId);
  const setStatus = useSetCustomerStatus(customerId);

  return (
    <div>
      <TopBar title="Customer" />

      {customer.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {customer.isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this customer.
          </div>
        </div>
      )}

      {customer.data && (() => {
        const data = customer.data;
        return (
          <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
            <Card className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-ink">{data.business_name}</h1>
                <p className="text-sm text-ink-muted">{data.owner_name}</p>
                <p className="mt-1 font-mono text-xs text-ink-muted">{data.customer_code}</p>
              </div>
              <CustomerStatusBadge status={data.status} />
            </Card>

            <div className="divide-y divide-border rounded-lg border border-border bg-white shadow-sm">
              <Row label="Mobile" value={data.mobile} />
              {data.alternate_mobile && <Row label="Alternate mobile" value={data.alternate_mobile} />}
              {data.gst_number && <Row label="GST number" value={data.gst_number} />}
            </div>

            <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <p className="text-sm text-ink-muted">Address</p>
              <p className="mt-1 text-sm font-medium text-ink">
                {data.address}, {data.city}, {data.state} {data.pincode}
              </p>
            </div>

            <div className="divide-y divide-border rounded-lg border border-border bg-white shadow-sm">
              <Row label="Credit limit" value={formatCurrency(data.credit_limit)} />
              <Row label="Payment terms" value={`${data.payment_terms} days`} />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant={data.status === "active" ? "danger" : "primary"}
                isLoading={setStatus.isPending}
                onClick={() => setStatus.mutate(data.status === "active" ? "inactive" : "active")}
              >
                {data.status === "active" ? "Deactivate customer" : "Activate customer"}
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
