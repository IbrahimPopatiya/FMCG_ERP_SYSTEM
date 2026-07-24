"use client";

import { useMemo, useState } from "react";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useOrders } from "@/lib/hooks/useOrders";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/utils/format";

function isWithinRange(iso: string, from: string, to: string): boolean {
  const d = new Date(iso).getTime();
  return d >= new Date(from).getTime() && d <= new Date(`${to}T23:59:59`).getTime();
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function SalesmanReportsPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const orders = useOrders();
  const customers = useCustomers(200);

  const [from, setFrom] = useState(() => toDateInputValue(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(() => toDateInputValue());

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of customers.data?.items ?? []) map.set(c.id, c.business_name);
    return map;
  }, [customers.data]);

  const filteredOrders = useMemo(
    () => (orders.data ?? []).filter((o) => isWithinRange(o.created_at, from, to)),
    [orders.data, from, to]
  );

  const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = filteredOrders.length;
  const activeCustomerIds = new Set(filteredOrders.map((o) => o.customer_id));

  const isLoading = orders.isLoading || customers.isLoading;

  return (
    <div>
      <SalesmanTopBar title="Reports" back hideAlerts />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <Card className="flex items-end gap-3 p-4">
          <label className="flex flex-1 flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-11 rounded-lg border border-border px-3 text-sm text-ink"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-11 rounded-lg border border-border px-3 text-sm text-ink"
            />
          </label>
        </Card>

        <Card className="grid grid-cols-3 gap-4 p-4">
          <div>
            <p className="text-xs font-medium text-ink-muted">Orders</p>
            {isLoading ? <Skeleton className="h-6 w-12" /> : <p className="text-lg font-semibold text-ink">{totalOrders}</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted">Sales</p>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <p className="text-lg font-semibold text-primary">{formatCurrency(totalSales)}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted">Customers Visited</p>
            {isLoading ? <Skeleton className="h-6 w-12" /> : <p className="text-lg font-semibold text-ink">{activeCustomerIds.size}</p>}
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Daily Sales</h2>
          <Button
            variant="secondary"
            onClick={() =>
              downloadCsv(
                `sales-report-${from}-to-${to}.csv`,
                [
                  ["Order Number", "Customer", "Date", "Status", "Total"],
                  ...filteredOrders.map((o) => [
                    o.order_number,
                    customerNameById.get(o.customer_id) ?? "",
                    formatDate(o.created_at),
                    o.status,
                    o.total,
                  ]),
                ]
              )
            }
          >
            Export CSV
          </Button>
        </div>

        <Card className="flex flex-col divide-y divide-border p-0">
          {isLoading && (
            <div className="p-4">
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {!isLoading && filteredOrders.length === 0 && (
            <p className="p-4 text-sm text-ink-muted">No orders in this date range.</p>
          )}
          {filteredOrders.map((o) => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{customerNameById.get(o.customer_id) ?? "Customer"}</p>
                <p className="text-xs text-ink-muted">
                  {o.order_number} · {formatDate(o.created_at)}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-ink">{formatCurrency(o.total)}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
