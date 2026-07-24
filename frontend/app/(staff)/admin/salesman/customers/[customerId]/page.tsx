"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { PhoneIcon, MapPinIcon, ChevronRightIcon } from "@/components/salesman/icons";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useCustomerDuesById } from "@/lib/hooks/useCustomerDuesById";
import { useOrders } from "@/lib/hooks/useOrders";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function CustomerDetailsPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const { customerId } = useParams<{ customerId: string }>();

  const customer = useCustomer(customerId);
  const dues = useCustomerDuesById(customerId);
  const orders = useOrders();

  const customerOrders = (orders.data ?? [])
    .filter((o) => o.customer_id === customerId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (customer.isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!customer.data) {
    return (
      <div>
        <SalesmanTopBar title="Customer" back hideAlerts />
        <p className="p-6 text-sm text-ink-muted">Customer not found.</p>
      </div>
    );
  }

  const c = customer.data;
  const availableCredit = c.credit_limit - (dues.data?.total_due ?? 0);

  return (
    <div>
      <SalesmanTopBar title={c.business_name} subtitle={c.customer_code} back hideAlerts />

      <div className="flex flex-col gap-4 p-4 pb-8 sm:p-6">
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-base font-semibold text-ink">{c.business_name}</p>
              <p className="text-xs text-ink-muted">{c.owner_name}</p>
            </div>
            <div className="flex gap-1.5">
              <Badge tone={c.status === "active" ? "success" : c.status === "blocked" ? "danger" : "neutral"}>
                {c.status}
              </Badge>
              {c.is_private && <Badge tone="neutral">Private</Badge>}
            </div>
          </div>
          <p className="text-sm text-ink-muted">
            {c.address}, {c.city}, {c.state} - {c.pincode}
          </p>
          <div className="flex gap-2">
            <a href={`tel:${c.mobile}`} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium text-ink">
              <PhoneIcon className="h-4 w-4" /> Call
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.address}, ${c.city}`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs font-medium text-ink"
            >
              <MapPinIcon className="h-4 w-4" /> Navigate
            </a>
          </div>
        </Card>

        <Card className="grid grid-cols-2 gap-4 p-4">
          <div>
            <p className="text-xs font-medium text-ink-muted">Credit Limit</p>
            <p className="text-base font-semibold text-ink">{formatCurrency(c.credit_limit)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted">Outstanding</p>
            {dues.isLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <p className="text-base font-semibold text-danger">{formatCurrency(dues.data?.total_due ?? 0)}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted">Available Credit</p>
            {dues.isLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <p className="text-base font-semibold text-ink">{formatCurrency(Math.max(availableCredit, 0))}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-ink-muted">Payment Terms</p>
            <p className="text-base font-semibold text-ink">{c.payment_terms} days</p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => router.push(`/admin/salesman/take-order?customerId=${c.id}`)}>Take Order</Button>
          <Button
            variant="secondary"
            disabled={!dues.data?.invoices.length}
            onClick={() => {
              const firstDue = dues.data?.invoices[0];
              if (firstDue) router.push(`/admin/salesman/payments/${firstDue.invoice_id}`);
            }}
          >
            Collect Payment
          </Button>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Outstanding Invoices</h2>
          <Card className="flex flex-col divide-y divide-border p-0">
            {dues.isLoading && (
              <div className="p-4">
                <Skeleton className="h-12 w-full" />
              </div>
            )}
            {!dues.isLoading && (dues.data?.invoices.length ?? 0) === 0 && (
              <p className="p-4 text-sm text-ink-muted">No outstanding invoices.</p>
            )}
            {dues.data?.invoices.map((inv) => (
              <Link
                key={inv.invoice_id}
                href={`/admin/salesman/payments/${inv.invoice_id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{inv.invoice_number}</p>
                  <p className="text-xs text-ink-muted">{formatDate(inv.invoice_date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-danger">{formatCurrency(inv.balance)}</p>
                  <ChevronRightIcon className="h-4 w-4 text-ink-muted" />
                </div>
              </Link>
            ))}
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Previous Orders</h2>
          <Card className="flex flex-col divide-y divide-border p-0">
            {orders.isLoading && (
              <div className="p-4">
                <Skeleton className="h-12 w-full" />
              </div>
            )}
            {!orders.isLoading && customerOrders.length === 0 && (
              <p className="p-4 text-sm text-ink-muted">No orders yet.</p>
            )}
            {customerOrders.slice(0, 10).map((order) => (
              <Link
                key={order.id}
                href={`/admin/salesman/orders/${order.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{order.order_number}</p>
                  <p className="text-xs text-ink-muted">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{formatCurrency(order.total)}</p>
                  <ChevronRightIcon className="h-4 w-4 text-ink-muted" />
                </div>
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
