# Phase 1 Database Schema — Simple Version
## Single Shop, Max 1000 Customers

This replaces the 83-table enterprise design in `DATABASE_SCHEMA_DESIGN_DOCUMENT.md` for Phase 1. That design assumes a multi-branch, multi-company distributor at real scale. You're running **one shop**. At 1000 customers max, order volume is low enough that a flat, boring schema is not just acceptable — it's the correct choice. Fewer tables means fewer joins, fewer bugs, and an accountant/junior dev can understand the whole thing in one sitting.

Still covers the full order-to-cash flow from the PRD (order → approval → trip → dispatch → invoice → delivery → payment), still keeps history where it actually matters (money, status changes), still keeps Tally as source of truth for inventory/ledger/GST.

---

## Tables (14 total)

### 1. `users`
Your internal staff — Admin, Salesman, Warehouse, Accountant, Driver, Cashier. One person can have one role (add a `role` column, not a separate roles/permissions system — you don't need RBAC tables for a handful of staff).
- name, mobile (login), role, status (active/inactive), created_at

### 2. `customers`
The shopkeepers who order from you.
- name, shop_name, mobile (login), address, gst_number (optional), assigned_salesman_id (→ users), credit_limit, status, created_at

### 3. `products`
Your catalogue. No separate Company/Brand/Category/SKU hierarchy tables — just columns.
- name, brand, category, unit (pcs/box/carton/kg…), price, gst_percent, image_url, active, created_at

### 4. `orders`
One row per order.
- customer_id, salesman_id, status (pending/approved/rejected/dispatched/invoiced/delivered/completed/cancelled), order_date, total_amount, created_at

### 5. `order_items`
Line items on an order.
- order_id, product_id, quantity, price, discount_percent, line_total

### 6. `vehicles`
Delivery vehicles.
- registration_number, type, status, active

### 7. `trips`
A vehicle+driver assigned to deliver a batch of orders on a given day.
- vehicle_id, driver_id (→ users), trip_date, status (planning/dispatched/completed)

### 8. `trip_orders`
Bridge: which orders are on which trip (many orders per trip).
- trip_id, order_id

### 9. `dispatches`
What actually got loaded for one order on one trip — separate from the order because loaded qty can differ from ordered qty.
- order_id, trip_id, status (loading/locked/invoiced), locked_at

### 10. `dispatch_items`
Ordered vs loaded quantity, with a reason if they differ.
- dispatch_id, product_id, ordered_qty, loaded_qty, reason (out_of_stock/damage/substitution/other, nullable)

### 11. `invoices`
Reference to the invoice generated in Tally — you don't store the real invoice, just the link to it.
- dispatch_id, customer_id, tally_invoice_number, invoice_pdf_url, invoice_amount, synced (yes/no), invoice_date

### 12. `deliveries`
Physical handover of goods.
- invoice_id, driver_id, status (out_for_delivery/delivered/partial/failed), proof_photo_url, delivered_at

### 13. `payments`
Money collected from a customer.
- customer_id, invoice_id (nullable — a payment can cover old dues, not just this invoice), amount, mode (cash/upi/cheque/bank_transfer), status (collected/verified/posted), collected_by (→ users), verified_by (→ users), collected_at

### 14. `status_history`
One shared table for "who changed what status, when, and why" — covers orders, dispatches, deliveries, and payments without needing four separate history tables. This is what gives you the audit trail the PRD asks for.
- entity_type (order/dispatch/delivery/payment), entity_id, from_status, to_status, changed_by (→ users), note, changed_at

---

## What's deliberately left out (and why)

- **No roles/permissions tables** — `users.role` is enough for a handful of staff. Add RBAC tables only if you ever have dozens of staff with overlapping custom permissions.
- **No separate order-revision/order-change tables** — `status_history` plus editing `order_items` directly covers it. You don't need an immutable snapshot system at this scale.
- **No multi-price-list tables** — one price per product on `products`. Add a `customer_prices` override table later only if you actually start giving individual customers special pricing.
- **No Tally sync-queue/log/mapping tables** — at 1000 customers your invoice volume is low; a `synced` boolean on `invoices` plus a retry cron is enough. Build the queue table if you outgrow simple retries.
- **No notification/alert tables** — send push/SMS/WhatsApp directly from application code when a status changes; log it in `status_history` if you need to know it happened. A dedicated table is overhead until you have many notification types to configure.
- **No polymorphic audit_log** — `status_history` plus `created_at`/`updated_at` on every table covers "what changed and when" for a business this size.

## If you outgrow this later
Add tables back one at a time, only when a real need shows up (e.g. multiple price lists, RBAC, a Tally sync queue) — don't pre-build them now. That's what the bigger 83-table doc is for, if the business ever scales to multi-branch/multi-warehouse.


## Diagrma

