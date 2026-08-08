"use client";

import type { MouseEvent } from "react";
import { PrinterIcon } from "@/components/admin/icons";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { SalesOrderResponse } from "@/types/salesOrder";

export interface PrintBillButtonProps {
  order: SalesOrderResponse;
  customerName: string;
  // Icon-only button for tight spaces (table rows); defaults to a labeled button.
  compact?: boolean;
  className?: string;
}

function displayQty(item: SalesOrderResponse["items"][number]): number {
  return item.loaded_qty || item.approved_qty || item.ordered_qty;
}

function buildBillHtml(order: SalesOrderResponse, customerName: string): string {
  const rows = order.items
    .map(
      (item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.product_name}</td>
          <td class="num">${displayQty(item)}${item.unit ? ` ${item.unit}` : ""}</td>
          <td class="num">${formatCurrency(item.price)}</td>
          <td class="num">${formatCurrency(item.line_total)}</td>
        </tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Order ${order.order_number}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; padding: 24px; }
          h1 { font-size: 18px; margin: 0 0 2px; }
          .muted { color: #666; font-size: 12px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
          .meta { text-align: right; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { padding: 8px 6px; border-bottom: 1px solid #e0e0e0; font-size: 13px; text-align: left; }
          th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; }
          .num { text-align: right; }
          .totals { margin-top: 16px; width: 260px; margin-left: auto; font-size: 13px; }
          .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
          .totals .grand { border-top: 2px solid #1a1a1a; margin-top: 6px; padding-top: 8px; font-size: 15px; font-weight: bold; }
          .footer { margin-top: 32px; font-size: 11px; color: #888; text-align: center; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Order Bill</h1>
            <p class="muted">Order #${order.order_number}</p>
          </div>
          <div class="meta">
            <p><strong>${customerName}</strong></p>
            <p class="muted">Placed: ${formatDate(order.created_at)}</p>
            <p class="muted">Status: ${order.status.toUpperCase()}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th class="num">Qty</th>
              <th class="num">Price</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="totals">
          <div><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
          ${order.discount > 0 ? `<div><span>Discount</span><span>-${formatCurrency(order.discount)}</span></div>` : ""}
          <div class="grand"><span>Total</span><span>${formatCurrency(order.total)}</span></div>
        </div>

        <p class="footer">This is a system-generated bill.</p>
      </body>
    </html>`;
}

export function PrintBillButton({ order, customerName, compact = false, className = "" }: PrintBillButtonProps) {
  function handlePrint(e: MouseEvent) {
    // Rows this button sits in are often wrapped in a Link — don't navigate.
    e.preventDefault();
    e.stopPropagation();

    const blob = new Blob([buildBillHtml(order, customerName)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank", "width=800,height=900");
    if (!printWindow) return;

    printWindow.onload = () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    };
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      aria-label={`Print bill for order ${order.order_number}`}
      title="Print bill"
      className={
        compact
          ? `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-ink-muted transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary ${className}`
          : `inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-ink-muted transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary ${className}`
      }
    >
      <PrinterIcon className="h-4 w-4" />
      {!compact && "Print"}
    </button>
  );
}