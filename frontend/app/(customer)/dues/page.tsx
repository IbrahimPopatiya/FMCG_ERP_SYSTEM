"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCustomerDues } from "@/lib/hooks/useCustomerDues";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function DuesPage() {
  const dues = useCustomerDues();
  const rows = dues.data?.invoices ?? [];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Dues</h1>
      </header>

      {dues.isLoading && (
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {dues.isError && (
        <div className="p-4">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load your dues.
          </div>
        </div>
      )}

      {dues.data && (
        <div className="flex flex-col gap-4 p-4 pb-6">
          <div className="rounded-xl border border-border bg-white p-6 text-center">
            <p className="text-sm text-ink-muted">Total outstanding</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatCurrency(dues.data.total_due)}</p>
          </div>

          {rows.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-ink-muted">
              You have no outstanding invoices. You&apos;re all settled up.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-white">
              {rows.map((invoice) => (
                <Link
                  key={invoice.invoice_id}
                  href={`/orders/${invoice.order_id}`}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-medium text-ink-muted">{invoice.invoice_number}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{formatDate(invoice.invoice_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{formatCurrency(invoice.balance)}</p>
                    <p className="text-xs text-ink-muted">of {formatCurrency(invoice.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
