"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { StoreIcon, ChevronRightIcon } from "@/components/customer/icons";
import { useSalesmanCustomers } from "@/lib/hooks/useSalesmanCustomers";

export default function SalesmanCustomersPage() {
  const { data, isLoading, isError, refetch } = useSalesmanCustomers();
  const customers = data?.items ?? [];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3 md:px-8">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Customers</h1>
        <p className="mt-0.5 text-xs text-ink-muted">Customers on your route</p>
      </header>

      {isLoading && (
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="p-4">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            Couldn&apos;t load customers.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && customers.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
          <h2 className="text-base font-semibold text-ink">No customers yet</h2>
          <p className="max-w-xs text-sm text-ink-muted">Customers on your assigned route will show up here.</p>
        </div>
      )}

      {!isLoading && !isError && customers.length > 0 && (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4 pb-6 md:p-8">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/salesman/customers/${customer.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <StoreIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{customer.business_name}</p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {customer.city} · {customer.mobile}
                </p>
              </div>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
