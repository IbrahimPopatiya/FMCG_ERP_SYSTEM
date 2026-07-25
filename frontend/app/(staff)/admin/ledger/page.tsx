"use client";

import Link from "next/link";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useCustomerDuesById } from "@/lib/hooks/useCustomerDuesById";
import { formatCurrency } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import type { CustomerListItem } from "@/types/customers";

export default function LedgerPage() {
  useRoleGuard(["admin", "manager", "cashier"]);

  const customers = useCustomers(200);
  const rows = customers.data?.items ?? [];

  return (
    <div>
      <AdminTopBar title="Ledger" subtitle="Customer Ledger" back />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <p className="text-sm text-ink-muted">Outstanding balance and credit limit per customer.</p>

        {customers.isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {customers.isError && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load customers.
          </div>
        )}

        {!customers.isLoading && !customers.isError && rows.length === 0 && (
          <Card className="rounded-2xl text-center text-sm text-ink-muted">No customers yet.</Card>
        )}

        <div className="flex flex-col gap-2">
          {rows.map((customer) => (
            <LedgerRow key={customer.id} customer={customer} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LedgerRow({ customer }: { customer: CustomerListItem }) {
  const dues = useCustomerDuesById(customer.id);

  return (
    <Link href={`/admin/customers/${customer.id}`}>
      <Card className="flex items-center justify-between gap-3 rounded-2xl">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{customer.business_name}</p>
          <p className="font-mono text-xs text-ink-muted">{customer.customer_code}</p>
          <p className="mt-1 text-xs text-ink-muted">Credit limit {formatCurrency(customer.credit_limit)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {dues.isLoading ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            <p
              className={`text-sm font-semibold ${
                (dues.data?.total_due ?? 0) > 0 ? "text-red-600" : "text-ink"
              }`}
            >
              {formatCurrency(dues.data?.total_due ?? 0)}
            </p>
          )}
          <CustomerStatusBadge status={customer.status} />
        </div>
      </Card>
    </Link>
  );
}
