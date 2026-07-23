"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  BackArrowIcon,
  FilterIcon,
  OrdersIcon,
  DownloadArrowIcon,
  WalletIcon,
  CalendarIcon,
  DocumentIcon,
  RupeeIcon,
} from "@/components/customer/icons";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";
import { useCustomerLedger } from "@/lib/hooks/useCustomerLedger";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { LedgerTransaction } from "@/types/customers";

type TypeFilter = "all" | "order" | "payment";

function StatTile({
  icon,
  tone,
  label,
  value,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-xl p-3.5 ${tone}`}>
      {icon}
      <div>
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: LedgerTransaction }) {
  const isOrder = transaction.type === "order";
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
      <div className="w-20 shrink-0">
        <p className="text-xs text-ink-muted">{formatDate(transaction.date)}</p>
      </div>
      <div className="w-20 shrink-0">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isOrder ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary"
          }`}
        >
          {isOrder ? "Order" : "Payment"}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{transaction.description}</p>
      </div>
      <div className="w-24 shrink-0 text-right">
        <p className={`text-sm font-semibold ${isOrder ? "text-danger" : "text-primary"}`}>
          {isOrder ? "−" : "+"}
          {formatCurrency(transaction.amount)}
        </p>
      </div>
      <div className="w-24 shrink-0 text-right">
        <p className="text-sm font-medium text-ink">{formatCurrency(transaction.balance)}</p>
      </div>
    </div>
  );
}

export default function CustomerLedgerPage() {
  const router = useRouter();
  const customer = useCurrentCustomer();
  const ledger = useCustomerLedger();
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const transactions = useMemo(() => {
    const rows = ledger.data?.transactions ?? [];
    if (filter === "all") return rows;
    return rows.filter((t) => t.type === filter);
  }, [ledger.data, filter]);

  const isLoading = customer.isLoading || ledger.isLoading;

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink"
          >
            <BackArrowIcon className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Customer Ledger</h1>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
          >
            <FilterIcon className="h-4 w-4" />
            Filter
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-border bg-white p-1 shadow-lg">
              {(["all", "order", "payment"] as TypeFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setFilter(option);
                    setFilterOpen(false);
                  }}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm ${
                    filter === option ? "bg-primary-soft font-medium text-primary" : "text-ink hover:bg-surface"
                  }`}
                >
                  {option === "all" ? "All" : option === "order" ? "Orders only" : "Payments only"}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {isLoading && (
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {(customer.isError || ledger.isError) && (
        <div className="p-4">
          <div className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            Couldn&apos;t load your ledger.
          </div>
        </div>
      )}

      {customer.data && ledger.data && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pb-28 md:p-8">
          <div className="rounded-xl border border-primary/20 bg-primary-soft p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {customer.data.business_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-ink">{customer.data.business_name}</p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {customer.data.city}, {customer.data.state}
                </p>
                {customer.data.gst_number && (
                  <p className="mt-0.5 text-xs text-ink-muted">GSTIN: {customer.data.gst_number}</p>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-primary/20 pt-3 text-center">
              <div>
                <p className="text-xs text-ink-muted">Credit Limit</p>
                <p className="mt-1 text-sm font-semibold text-ink">{formatCurrency(ledger.data.credit_limit)}</p>
              </div>
              <div className="border-x border-primary/20">
                <p className="text-xs text-ink-muted">Available Credit</p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {formatCurrency(ledger.data.available_credit)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Current Balance</p>
                <p className="mt-1 text-sm font-semibold text-danger">
                  {formatCurrency(ledger.data.current_balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              icon={<OrdersIcon className="h-5 w-5 text-primary" />}
              tone="bg-primary-soft"
              label="Total Orders"
              value={formatCurrency(ledger.data.total_invoiced)}
            />
            <StatTile
              icon={<DownloadArrowIcon className="h-5 w-5 text-primary" />}
              tone="bg-primary-soft"
              label="Total Payments"
              value={formatCurrency(ledger.data.total_payments)}
            />
            <StatTile
              icon={<WalletIcon className="h-5 w-5 text-accent" />}
              tone="bg-accent-soft"
              label="Outstanding Invoices"
              value={String(ledger.data.outstanding_invoices)}
            />
            <StatTile
              icon={<CalendarIcon className="h-5 w-5 text-ink-muted" />}
              tone="bg-surface"
              label="Last Order On"
              value={ledger.data.last_order_date ? formatDate(ledger.data.last_order_date) : "—"}
            />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-ink">Transaction History</h2>
            <div className="overflow-hidden rounded-xl border border-border bg-white">
              <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2 text-xs font-medium text-ink-muted">
                <div className="w-20 shrink-0">Date</div>
                <div className="w-20 shrink-0">Type</div>
                <div className="min-w-0 flex-1">Details</div>
                <div className="w-24 shrink-0 text-right">Amount</div>
                <div className="w-24 shrink-0 text-right">Balance</div>
              </div>
              {transactions.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-ink-muted">No transactions to show.</p>
              ) : (
                transactions.map((t, i) => <TransactionRow key={`${t.type}-${t.reference}-${i}`} transaction={t} />)
              )}
            </div>
          </div>
        </div>
      )}

      {customer.data && ledger.data && (
        <div className="sticky bottom-0 z-10 border-t border-border bg-white p-4 md:px-8">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Current Balance (You Have to Pay)
                </p>
                <p className="text-xs text-ink-muted">
                  As on {ledger.data.last_order_date ? formatDate(ledger.data.last_order_date) : "today"}
                </p>
              </div>
              <p className="text-lg font-semibold text-danger">{formatCurrency(ledger.data.current_balance)}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled
                title="Coming soon"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-ink-muted opacity-60"
              >
                <DocumentIcon className="h-4 w-4" />
                Statement
              </button>
              <button
                type="button"
                disabled
                title="Coming soon — online payment isn't set up yet"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary/50 px-4 py-3 text-sm font-semibold text-white opacity-60"
              >
                <RupeeIcon className="h-4 w-4" />
                Make Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
