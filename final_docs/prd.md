# Product Requirements Document (PRD)
## Distribution Management System (DMS) — FMCG B2B Wholesale Platform

| | |
|---|---|
| **Document Owner** | Product Team |
| **Status** | Draft v2.0 |
| **Last Updated** | 2026-07-19 |
| **Related Docs** | `database_schema_docs.markdown`, `apis_doc.md`, `api_reference.md`, `ui_ux_functional_requirements.md` |

> **v2 change:** Customers can now **place their own orders** through a customer self-service portal (previously staff-only). This adds a Customer persona (§4), customer self-ordering requirements (§6.2), and small additive schema/API changes (§9). The rest of the staff-driven flow is unchanged.

---

## 1. Purpose / Overview

This document defines the product requirements for a **Distribution Management System (DMS)** — a B2B wholesale/distribution platform built for the Indian FMCG market. It digitizes the full order-to-cash and procurement cycle for a distributor: taking orders from retail customers (shops) — **both via field salesmen and directly by customers through a self-service portal** — invoicing with GST, delivering via van, collecting payment, purchasing stock from suppliers, and handling returns — with full inventory and financial traceability.

---

## 2. Problem Statement

Distributors currently manage orders, stock, and collections through manual registers, spreadsheets, or disconnected tools. This causes:

- No real-time visibility into stock across warehouses.
- Manual, error-prone GST calculation (CGST/SGST/IGST) on every invoice.
- No audit trail for stock changes or financial transactions.
- Delayed reconciliation of van sales, deliveries, and cash/UPI collections.
- No standard way to track returns (damaged/expired goods) back into inventory.

---

## 3. Goals & Objectives

- Provide a single system of record for products, customers, orders, invoices, deliveries, payments, purchases, and returns.
- Ensure every stock movement is traceable via an append-only inventory ledger.
- Automate GST computation (CGST/SGST vs IGST) and invoice generation.
- Support offline-friendly operations for field staff (salesmen, drivers) using client-generated IDs.
- Provide full auditability (who did what, when) for compliance and dispute resolution.

### Non-Goals (Out of Scope for v1)

- Vehicle operational tracking (fuel, mileage, daily trip logs).
- Full Tally two-way sync (v1 is one-way push, retry on failure).
- Multi-currency support (INR only).
- Customer self-service beyond ordering and viewing their own orders/invoices/dues/deliveries (no customer-managed returns or payments online in v1 — those stay staff-processed).

---

## 4. Target Users / Personas

| Persona | Role | Key Needs |
|---|---|---|
| **Salesman** | Field sales, route-based | Take customer orders, view price lists, check stock |
| **Admin / Manager** | Back-office | Approve orders, manage master data, view reports |
| **Driver** | Delivery & collection | Load van, deliver, collect payment, capture signature/GPS |
| **Cashier** | Finance | Verify payments, reconcile invoices, mark cheque bounces |
| **Warehouse Staff** | Inventory | Receive purchases, process returns, adjust stock |
| **Customer (Shop)** | Self-service (external) | Log in, browse the catalogue at their own price list, place their own orders, and track their orders, invoices, outstanding dues, and deliveries |

> The Customer is an **external** persona (a shop owner/buyer), unlike the internal staff personas above. Customers authenticate against the `CUSTOMERS` record, not the `USERS` table, and can only ever see and act on their **own** data.

---

## 5. Scope

### 5.1 In Scope (Core Modules)

1. **Master Data**: Users, Routes, Customers, Categories, Brands, Products, Price Lists, Warehouses, Suppliers, Vehicles.
2. **Selling Flow**: Sales Order → Approval → Invoice → Delivery → Payment. Orders can be created **either by a salesman** (on the customer's behalf) **or by the customer directly** via the self-service portal; both feed the same approval → invoice → delivery → payment flow.
3. **Customer Self-Service Portal**: Customer login, catalogue browsing at the customer's own price list, self-ordering, and read-only tracking of their own orders, invoices, dues, and deliveries.
4. **Buying Flow**: Purchase → Receipt → Stock update.
5. **Returns Flow**: Return request → Approval → Stock reconciliation.
6. **Inventory Ledger**: Append-only movement log + rebuildable stock summary.
7. **Audit Log**: System-wide who-did-what trail.
8. **File Handling**: Signatures, product images, return/delivery photos via object storage.
9. **Tally Sync**: One-way push of invoices/payments/returns with retry.

### 5.2 Out of Scope

See Non-Goals above.

---

## 6. Functional Requirements

### 6.1 Master Data Management
- FR-1: Admin can create/update/deactivate Users with roles (`admin`, `salesman`, `driver`, `manager`; extend to `dispatcher`, `cashier`).
- FR-2: Admin can manage Routes and assign a Salesman to each.
- FR-3: Admin can manage Customers (business details, credit limit, payment terms, price list, GPS location).
- FR-4: Admin can manage Categories (nested), Brands, and Products (SKU, barcode, MRP, GST rate, unit/packing).
- FR-5: Admin can manage Price Lists and assign product-specific prices per list.
- FR-6: Admin can manage Warehouses (with state, for GST determination) and Suppliers.
- FR-7: Admin can manage Vehicles and assign a driver + home warehouse.

### 6.2 Selling Flow
- FR-8: Salesman can create a Sales Order with multiple line items for a customer; prices pull from the customer's assigned price list.
- FR-8a: A **customer can create their own Sales Order** through the self-service portal. The `customer_id` is taken from the authenticated customer (never sent/trusted from the client); such orders have **no salesman** and are marked `order_source = customer`. They enter the same `pending` state and follow the same approval → invoice → delivery → payment flow.
- FR-8b: A customer can browse the product catalogue and see **their own price-list prices** and stock availability, and can view (read-only) their **own** orders, invoices, outstanding dues, and delivery status. A customer can never see or act on another customer's data, nor access any staff/master-data function.
- FR-9: System auto-calculates subtotal, discount, GST (CGST+SGST or IGST based on warehouse vs. customer state), round-off, and total — server-side only.
- FR-10: Admin/Manager can approve an order (sets `approved_qty`), which reserves stock via an inventory movement.
- FR-11: Warehouse staff confirms loaded quantities (`loaded_qty`), which deducts stock (`sold_out` movement).
- FR-12: System generates one Invoice per Sales Order with GST breakdown and `place_of_supply`.
- FR-13: A Delivery record is created per invoice, tracking status, GPS, timestamps, and customer signature.
- FR-14: Driver can mark delivery started, arrived, completed (with GPS + signature), or failed.
- FR-15: Driver/Cashier can record Payments (cash/UPI/cheque, partial allowed); invoice `payment_status` is derived automatically from payments vs. invoice total.
- FR-16: Cashier can verify or mark a payment as bounced.

### 6.3 Buying Flow
- FR-17: Admin/Warehouse staff can create a Purchase (draft) with line items from a supplier.
- FR-18: On receipt, system creates a `purchase_in` inventory movement and updates stock automatically.

### 6.4 Returns Flow
- FR-19: Any authorized user can raise a Return against an invoice with line items and a reason (damaged/expired/wrong_item/not_needed), optionally with a photo.
- FR-20: Admin approves/rejects the return; on completion, stock is updated (`returned_in`, `damaged`, or `expired` movement) based on reason.

### 6.5 Inventory
- FR-21: All stock changes are recorded as immutable rows in an Inventory Movements ledger; the Inventory summary table is derived/rebuildable from it.
- FR-22: Manual stock adjustments and warehouse-to-warehouse transfers are supported as explicit actions (not direct edits to stock counters).

### 6.6 Auditing & Files
- FR-23: All financial/state-changing actions write an Audit Log entry (user, action, entity, before/after values).
- FR-24: Images, signatures, and photos are uploaded to object storage; only the path/URL is stored in the database.

### 6.7 Tally Integration
- FR-25: System pushes pending invoices, payments, and returns to Tally; failed syncs can be retried per entity.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Data Integrity** | Every document + its stock movement must be created in a single database transaction. |
| **Auditability** | Soft deletes only (`deleted_at`); no hard deletes on master/transactional data. |
| **Offline Support** | IDs are client-generated (UUID v7) to support offline order-taking/delivery apps and later sync. |
| **Money Precision** | All monetary values stored as `Decimal(12,2)`; no floating point. |
| **Security** | Passwords stored hashed; role-based access control on all APIs. |
| **Performance** | Indexed foreign keys and targeted composite indexes (see schema doc §8) for order history, outstanding-dues, and stock lookups. |
| **Compliance** | GST-compliant invoices (CGST/SGST/IGST, place of supply, rounding) per Indian tax rules. |

---

## 8. API & Data Model Alignment

This PRD is built directly on top of:
- **Database schema** (`database_schema_docs.markdown`) — defines all entities, relationships, enums, and the inventory ledger design.
- **API design** (`apis_doc.md`) — defines a REST API (`/api/v1/...`) organized by business resource and action, not raw table CRUD (e.g., `POST /orders/{id}/approve`, `POST /purchases/{id}/receive`, `POST /deliveries/{id}/complete`).

Key architectural principle carried into this PRD: **the frontend never directly edits inventory, GST totals, or payment status** — these are always server-derived, written through business-action APIs, and backed by the audit/movement ledgers.

Extended for customer self-service: **the identity of the ordering customer is server-derived too.** When a customer places an order, the backend uses the `customer_id` from the authenticated session — it never trusts a `customer_id` sent in the request body. Every customer-facing API is scoped so a customer can only read/write their own records. Staff-only actions (approve, load, invoice, deliver, payment verify, master data) remain unavailable to customers regardless of what the client sends.

---

## 9. Known Gaps / Open Items

These are identified mismatches between current schema/API design and likely full requirements — to be resolved before/during build:

1. **Customer authentication (new in v2)**: `CUSTOMERS` has no credentials today. To let customers log in, add a nullable `password_hash` and a `login_enabled` flag to `CUSTOMERS`. Login is unified (`POST /auth/login` resolves a staff user *or* a customer by mobile + password and returns the principal type). Customers are **not** rows in `USERS` and have no `role`.
2. **Order source (new in v2)**: `SALES_ORDERS.salesman_id` must become **nullable** (customer-placed orders have no salesman), and a new `order_source` enum (`salesman`, `customer`) should be added to distinguish them. `created_by` stays null for customer-placed orders.
3. **Customer GPS**: `CUSTOMERS` table has no latitude/longitude columns yet; needed for location capture.
4. **Roles**: `role` enum needs `dispatcher` and `cashier` added.
5. **Delivery detail**: Missing fields for delivery photos, UPI screenshot, returned-goods photo, voice notes, and outcome states (`partial`, `customer_closed`, `customer_refused`), plus item-level delivered/pending quantities.
6. **Vehicle operations**: Current `VEHICLES` table is master-only; daily trip/fuel/mileage tracking needs new tables (future phase).
7. **Confirm business rules**: unique-code reuse after soft delete, rounding convention, inventory movement quantity sign convention, and full audit-log scope (see schema doc §9).

---

## 10. Success Metrics

- % of orders with zero manual GST correction post-invoice generation.
- Time from delivery completion to payment reconciliation.
- Inventory discrepancy rate (physical count vs. system ledger).
- % of invoices successfully synced to Tally on first attempt.
- Reduction in return-to-restock turnaround time.

---

## 11. Milestones (Suggested Phasing)

| Phase | Scope |
|---|---|
| **Phase 1 — MVP** | Master data, Sales Order → Invoice → Delivery → Payment, basic Inventory ledger |
| **Phase 2** | Purchases, Returns, Audit Log, File uploads |
| **Phase 3** | Customer self-service portal (login, catalogue, self-ordering, order/invoice/dues/delivery tracking), Tally sync, reporting/dashboards, offline sync hardening |
| **Phase 4** | Vehicle operations tracking, advanced delivery outcomes, customer GPS |

---

*This PRD should be updated alongside the schema and API docs as the product evolves — treat all three as a single source of truth.*
