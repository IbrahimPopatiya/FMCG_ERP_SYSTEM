"use client";

import type { MouseEvent } from "react";
import { PrinterIcon } from "@/components/admin/icons";
import { formatCurrency, formatCurrencyWhole, formatDate } from "@/lib/utils/format";
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

function altQty(item: SalesOrderResponse["items"][number]): string {
  if (item.units_per_box > 1) {
    return `${(displayQty(item) * item.units_per_box).toFixed(2)} Pcs`;
  }
  return "-";
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitsToWords(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${TENS[tens]}${ones ? ` ${ONES[ones]}` : ""}`;
}

function threeDigitsToWords(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigitsToWords(rest));
  return parts.join(" ");
}

function amountToWords(amount: number): string {
  const rupees = Math.round(amount);
  if (rupees === 0) return "INR Zero Only.";

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitsToWords(hundred));

  return `INR ${parts.join(" ")} Only.`;
}

function buildBillHtml(
  order: SalesOrderResponse,
  customerName: string
): string {
  const rows = order.items
    .map(
      (item, i) => `
        <tr>
          <td class="check">
            <span class="checkbox"></span>
          </td>

          <td class="sr">
            ${i + 1}
          </td>

          <td class="desc">
            ${item.product_name}
          </td>

          <td class="num">
            ${displayQty(item)}${item.unit ? ` ${item.unit}` : ""}
          </td>

          <td class="num">
            ${altQty(item)}
          </td>

          <td class="num">
            ${formatCurrency(item.price)}
          </td>

          <td class="num amount">
            ${formatCurrencyWhole(item.line_total)}
          </td>
        </tr>
      `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>

  <meta charset="UTF-8" />

  <style>

    * {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1a1a1a;
      padding: 20px;
      margin: 0;
    }

    .sheet {
      border: 3px double #1a1a1a;
      width: 100%;
    }

    /* =========================
       TITLE
       ========================= */

    h1 {
      font-size: 40px;
      margin: 0;
      padding: 16px 0;
      text-align: center;
      letter-spacing: 0.02em;
      border-bottom: 2px solid #1a1a1a;
    }

    /* =========================
       HEADER
       ========================= */

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      border-bottom: 2px solid #1a1a1a;

      padding: 12px 16px;

      min-height: 90px;
    }

    .header .to {
      font-size: 15px;
      font-weight: bold;
      line-height: 1.6;
    }

    .name {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .salesman {
      font-size: 14px;
      font-weight: normal;
    }

    .header .meta {
      text-align: right;
      font-size: 13px;
      line-height: 1.6;
      white-space: nowrap;
    }

    .vehicle {
      margin-right: 80px;
    }

    /* =========================
       TABLE
       ========================= */

    table {
      width: 100%;
      border-collapse: collapse;

      /*
       * IMPORTANT:
       * Prevent browser from resizing columns
       * based on content.
       */
      table-layout: fixed;
    }

    /* =========================
       COLUMN WIDTHS
       =========================

       Checkbox     = 2.5%
       Sr           = 5.5%
       Description  = 45%
       Qty          = 11.75%
       Alt Qty      = 11.75%
       Rate         = 11.75%
       Amount       = 11.75%

       Total = 100%
    */

    col.check-col {
      width: 3.5%;
    }

    col.sr-col {
      width: 5.5%;
    }

    col.desc-col {
      width: 45%;
    }

    col.qty-col {
      width: 11.75%;
    }

    col.alt-qty-col {
      width: 11.75%;
    }

    col.rate-col {
      width: 11.75%;
    }

    col.amount-col {
      width: 11.75%;
    }

    /* =========================
       TABLE CELLS
       ========================= */

    th,
    td {
      padding: 8px 10px;

      border-bottom: 1px solid #1a1a1a;
      border-right: 1px solid #1a1a1a;

      font-size: 13px;
      line-height: 1.25;

      vertical-align: middle;

      overflow: hidden;
    }

    th:last-child,
    td:last-child {
      border-right: none;
    }

    th {
      font-size: 13px;
      font-weight: bold;

      text-align: center;

      border-bottom: 2px solid #1a1a1a;

      white-space: nowrap;
    }

    /* =========================
       CHECKBOX
       ========================= */

    th.check,
    td.check {
      text-align: center;
      padding: 6px 2px;
    }

    .checkbox {
      display: inline-block;

      width: 13px;
      height: 13px;

      border: 1.5px solid #1a1a1a;
    }

    /* =========================
       SERIAL NUMBER
       ========================= */

    th.sr,
    td.sr {
      text-align: center;

      padding-left: 4px;
      padding-right: 4px;
    }

    /* =========================
       ITEM DESCRIPTION
       ========================= */

    th.desc,
    td.desc {
      text-align: left;
    }

    td.desc {
      font-weight: bold;

      /*
       * Product names can use the complete
       * 45% description column.
       */
      white-space: normal;

      word-break: normal;

      overflow-wrap: break-word;
    }

    /* =========================
       NUMERIC COLUMNS
       ========================= */

    th.num,
    td.num {
      text-align: right;

      white-space: nowrap;
    }

    .amount {
      font-weight: bold;
    }

    /* =========================
       EMPTY SPACE AFTER ITEMS
       =========================

       This row creates the large blank
       area before the final total.

       IMPORTANT:
       Do not remove this row.
    */

    .fill-row {
      height: 500px !important;
    }

    .fill-row td {
      height: 500px !important;

      min-height: 500px !important;

      vertical-align: top;

      border-bottom: 1px solid #1a1a1a;

      border-right: 1px solid #1a1a1a;
    }

    .fill-row td:last-child {
      border-right: none;
    }

    /* =========================
       FINAL TOTAL
       ========================= */

    .footer-row td {
      border-bottom: none;

      border-top: 2px solid #1a1a1a;

      padding: 14px 16px;

      font-size: 15px;

      font-weight: bold;
    }

    .footer-row .grand {
      text-align: right;

      font-size: 16px;

      white-space: nowrap;
    }

    /* =========================
       PRINT
       ========================= */

    @media print {

      body {
        padding: 0;
        margin: 0;
      }

      .sheet {
        width: 100%;
      }

    }

  </style>

</head>

<body>

  <div class="sheet">

    <!-- =========================
         TITLE
         ========================= -->

    <h1>Estimate</h1>


    <!-- =========================
         HEADER
         ========================= -->

    <div class="header">

      <div class="name">

        <div class="to">
          To, ${customerName.toUpperCase()}
        </div>

        <div class="salesman">
          Salesman :
          ${order.order_source === "salesman"
      ? "Salesman"
      : "Customer"
    }
        </div>

      </div>


      <div class="meta">

        <div>
          No. &nbsp; : &nbsp; ${order.order_number}
        </div>

        <div>
          Date : &nbsp; ${formatDate(order.created_at)}
        </div>

        <div class="vehicle">
          Vehicle-No :
        </div>

      </div>

    </div>


    <!-- =========================
         BILL TABLE
         ========================= -->

    <table>

      <!-- FIXED COLUMN WIDTHS -->

      <colgroup>

        <col class="check-col" />

        <col class="sr-col" />

        <col class="desc-col" />

        <col class="qty-col" />

        <col class="alt-qty-col" />

        <col class="rate-col" />

        <col class="amount-col" />

      </colgroup>


      <!-- =========================
           TABLE HEADER
           ========================= -->

      <thead>

        <tr>

          <th class="check">
          </th>

          <th class="sr">
            Sr
          </th>

          <th class="desc">
            Item Description
          </th>

          <th class="num">
            Qty.
          </th>

          <th class="num">
            Alt Qty
          </th>

          <th class="num">
            Rate
          </th>

          <th class="num">
            Amount
          </th>

        </tr>

      </thead>


      <!-- =========================
           ITEMS
           ========================= -->

      <tbody>

        ${rows}


        <!-- =========================
             EMPTY SPACE
             
             No R/F
             No NaN
             No subtotal
             
             This row only maintains
             the blank area.
             ========================= -->

        <tr class="fill-row">

          <td></td>

          <td></td>

          <td class="desc"></td>

          <td></td>

          <td></td>

          <td></td>

          <td></td>

        </tr>

      </tbody>


      <!-- =========================
           FINAL TOTAL
           ========================= -->

      <tfoot>

        <tr class="footer-row">

          <td colspan="6">
            ${amountToWords(order.total)}
          </td>

          <td class="grand">
            ${formatCurrencyWhole(order.total)}
          </td>

        </tr>

      </tfoot>

    </table>

  </div>

</body>
</html>
`;
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
