# UI/UX Functional Requirements — DMS Web App
## Distribution Management System (FMCG B2B Wholesale)

| | |
|---|---|
| **Audience** | UI/UX Designer |
| **Purpose** | Describe **what** the application must let users do, so you can design clean, minimal, fast, user-focused screens. |
| **Status** | v1 requirements for design |
| **Related** | `prd.md` (product vision), `api_reference.md` (exact data each screen shows/collects) |

> **How to use this document.** This lists the **functionality** every part of the app must support — the tasks users perform, the data each screen shows, the actions available, and the states to design for. It does **not** prescribe layout, colors, or components — that's your job. Propose screen designs against these requirements; we'll review, approve, and request changes.
>
> **Our design intent (the brief in one line):** a **clean, minimal, fast, friendly** interface where each role can finish its core task in as few steps as possible, with no clutter and no confusion. Speed and clarity beat richness.

---

## 1. What the Product Is

A distributor's back-office + field operations system for the Indian FMCG wholesale market. It runs the full cycle:

**Take order → approve → invoice → deliver → collect payment**, plus **buy stock from suppliers**, **handle returns**, and **track inventory** — all with a full audit trail and GST-compliant invoices.

The app has three clear usage contexts:
- **Back-office (desktop-first):** admins, managers, cashiers, warehouse staff doing data entry, approvals, reconciliation, and reporting. Dense tables, forms, filters.
- **Field (mobile-first):** salesmen taking orders at shops, drivers delivering and collecting cash. Big touch targets, minimal typing, works one-handed, camera + GPS.
- **Customer self-service portal (mobile + desktop):** external shop owners/buyers who log in to browse the catalogue at their own prices, place their own orders, and track their orders, invoices, dues, and deliveries. This is a **separate, simpler surface** from the staff app — a customer never sees staff screens.

Design should account for all three. A responsive web app is expected; field and customer flows must be comfortable on a phone.

---

## 2. Users & What Each One Needs

| Role | Primary device | Core jobs they need the UI to make easy |
|---|---|---|
| **Admin** | Desktop | Manage all master data, users, and settings; see everything. |
| **Manager** | Desktop | Approve orders, oversee operations, view reports/dashboards. |
| **Salesman** | Mobile | Take customer orders quickly, browse products/prices, check stock, see their route's customers. |
| **Driver** | Mobile | See today's deliveries, navigate to shop, mark delivery progress, capture signature/photo/GPS, collect cash/UPI. |
| **Cashier** | Desktop | Verify payments, reconcile invoices, mark cheque bounces, track outstanding dues. |
| **Warehouse / Dispatcher** | Desktop / tablet | Receive purchases, load orders onto vans, process returns, adjust/transfer stock. |
| **Customer (Shop)** — *external* | Mobile + desktop | Log in, browse catalogue at their own price list, place their own orders, and track their own orders, invoices, dues, and deliveries. |

**Role-based UI:** each role should land on a home/dashboard relevant to them and only see navigation for what they're allowed to do. A salesman should not see purchase or payment-verification screens; a driver's app is essentially just "my deliveries." **The customer portal is a distinct, minimal surface** — customers see only their own catalogue, orders, invoices, dues, and deliveries, never any staff or master-data screens.

---

## 3. Global / Cross-Cutting Requirements

These apply to almost every screen — design them once as consistent patterns.

### 3.1 Authentication
- **Login** by mobile number + password. Simple, fast, forgiving on a phone. **One login screen** serves both staff and customers (unified login).
- After login, the system returns whether the principal is a **staff user** (with a role) or a **customer** — route staff to their role's home and customers to the **customer portal**. These are two different destinations from the same login.
- **Logout** always reachable.
- Handle "session expired" gracefully (prompt to log in again without losing context where possible).

### 3.2 Navigation & Shell
- Persistent primary navigation to the modules the role can access (see §5 map).
- Clear indication of **who is logged in** and their role.
- Fast global **search** where it helps (e.g. find a customer, product, order, or invoice quickly).

### 3.3 List / Table Screens (used by almost every module)
Nearly every entity has a "browse many" screen. Each needs:
- **Search** by the fields that matter (name, code, number, mobile).
- **Filters** relevant to the entity (status, date range, route, warehouse, category, etc.).
- **Sorting** on key columns.
- **Pagination** or lazy loading for large lists.
- **Status shown clearly** (badge/pill) — status drives most decisions in this app.
- **Row → detail** navigation, and quick actions where useful (e.g. approve, cancel).
- An **empty state** (nothing yet / no results for this filter) and a clear "create new" path.

### 3.4 Detail Screens
- Show the full record plus its **related items** (e.g. an order shows its line items; an invoice shows its payments and delivery).
- Show the record's **status and history/timeline** where the entity changes state over time (orders, deliveries, returns, purchases).
- Surface the **actions available for the current status** (e.g. a `pending` order shows "Approve" and "Cancel"; an `approved` order shows "Load").

### 3.5 Create / Edit Forms
- Group fields logically; keep required vs optional clear.
- **Inline validation** with clear, friendly error messages (fail early at the field, not after submit).
- Show which fields are **system-calculated and read-only** (see §3.7) — never as editable inputs.
- Support "save" feedback (success confirmation, error recovery without losing entered data).

### 3.6 Status is everywhere — design a consistent status system
Many entities move through states. The UI must make the current state obvious and show what's allowed next. States to represent:
- **Order:** pending → approved → loaded → (invoiced) → cancelled
- **Purchase:** draft → received / cancelled
- **Delivery:** pending → out_for_delivery → arrived → delivered / failed
- **Invoice payment:** unpaid / partial / paid
- **Payment:** pending → cleared / bounced
- **Return:** requested → approved / rejected → completed
- **Customer:** active / inactive / blocked
- **Vehicle:** available / in_use / maintenance
- **User / Product / Warehouse / Supplier:** active / inactive

### 3.7 Server-calculated values are read-only (important business rule)
The frontend **never lets users type or edit** money, GST (CGST/SGST/IGST), discounts, totals, round-off, stock counts, or payment status. These are always calculated by the server and **displayed** to the user. Design these as clearly presented read-only figures (e.g. an order/invoice summary panel), not input fields. Users enter the *inputs* (customer, products, quantities); the system shows the *computed results*.

### 3.8 Money, GST & numbers
- All money is INR, 2 decimals. Show ₹ consistently.
- Invoices/orders show a clear **breakdown**: subtotal, discount, CGST + SGST **or** IGST, round-off, total. (Same-state sales show CGST+SGST; cross-state show IGST — the server decides; the UI just displays whichever applies.)
- Make totals and outstanding amounts scannable at a glance.

### 3.9 Files, camera & photos (mobile-critical)
Several flows attach images. Design capture/upload that's quick on a phone:
- **Customer:** shop image (optional).
- **Product / Category / Brand:** product image, category image, brand logo.
- **Delivery:** customer signature (draw on screen), delivery photo, UPI screenshot.
- **Return:** photo of damaged/expired goods.
Uploads happen first (returns a stored path), then attach to the record — design a smooth "take/choose photo → preview → attached" experience with progress and retry.

### 3.10 Location / GPS (mobile-critical)
- **Customer location:** capture/save the shop's GPS coordinates; ideally show on a map.
- **Delivery:** capture GPS on arrival and on completion; a map view for the driver to navigate helps.

### 3.11 Feedback, loading & error states
Every data-driven screen needs designs for:
- **Loading** (fetching data / submitting).
- **Empty** (no records yet, or no results for filters).
- **Error** (couldn't load / couldn't save) with a clear retry.
- **Success confirmation** for actions (order approved, payment recorded, delivery completed).
- **Confirmation prompts** for destructive or irreversible actions (cancel order, delete, mark bounced).

### 3.12 Offline-friendliness (field flows)
Salesman order-taking and driver delivery should tolerate poor connectivity: allow the user to complete the task and sync when back online, with clear "pending sync / synced" indication. (Records use client-generated IDs to support this.) Design should not assume a perfect connection in the field.

---

## 4. Functional Requirements by Module

For each module: who uses it, the screens/functionality needed, key actions, and what to display. Field names and exact payloads are in `api_reference.md`.

### 4.1 Dashboard / Home (role-specific)
Each role lands on a relevant home. Suggested focus per role (final content up to design + our review):
- **Admin/Manager:** today's orders, pending approvals, outstanding dues, low-stock alerts, deliveries in progress, sales snapshot.
- **Salesman:** my route's customers, my orders today, quick "new order".
- **Driver:** my deliveries today with status and next stop.
- **Cashier:** payments to verify, outstanding invoices, cheques pending/bounced.
- **Warehouse:** purchases to receive, orders to load, returns to process, low stock.
- **Customer (portal):** a quick "place an order" entry point, their recent orders and statuses, and outstanding dues at a glance.

### 4.2 Users & Staff (Admin)
- List staff with role and status; search/filter by role and status.
- Create staff (name, mobile, email, password, role).
- Edit staff profile/role.
- Activate / deactivate a user.
- Soft-delete a user.

### 4.3 Routes (Admin)
- List routes with assigned salesman and status.
- Create/edit a route.
- Assign or change the salesman on a route.
- Soft-delete a route.

### 4.4 Customers (Admin, Salesman)
- List/search customers by name, code, mobile; filter by route, status.
- Create/edit customer: business details, owner, contacts, GST number, full address, **credit limit**, **payment terms (days)**, assigned **route** and **price list**.
- Change status: active / inactive / **blocked** (e.g. block a defaulter).
- **Capture/update GPS location** (map + "use my current location" on mobile).
- Customer detail: profile, location, plus useful context (their orders, outstanding dues) where helpful.
- Soft-delete a customer.

### 4.5 Catalogue: Categories, Brands, Products (Admin)
- **Categories:** list (support nested/parent categories), create/edit (name, optional parent, image), soft-delete.
- **Brands:** list, create/edit (name, logo), soft-delete.
- **Products:** the catalogue.
  - List/search by name, SKU, barcode; filter by category, brand, status.
  - Create/edit: SKU, barcode, name, category, brand, unit, packing, MRP, selling price, GST rate, minimum stock, image.
  - Activate / deactivate; soft-delete.
  - **Note:** product screens **never** show editable stock — stock lives in Inventory (§4.10).

### 4.6 Price Lists (Admin)
- List price lists; create/edit (name, description); soft-delete.
- Manage the **items inside a price list**: set/change/remove a specific price per product. Design a comfortable way to see and bulk-manage many product prices in one list (this can be large).
- Make clear that a product with no special price falls back to its default selling price.

### 4.7 Warehouses & Suppliers (Admin)
- **Warehouses:** list, create/edit (name, address, **state** — matters for GST), activate/deactivate, soft-delete.
- **Suppliers:** list/search, create/edit (code, name, GST number, mobile, address), activate/deactivate, soft-delete.

### 4.8 Vehicles (Admin)
- List vehicles with driver, home warehouse, and status.
- Create/edit (vehicle number, driver, warehouse, capacity).
- Assign/change driver; change status (available / in_use / maintenance); soft-delete.

### 4.9 Sales Orders (Salesman, Manager, Warehouse) — core flow
This is the most important, most-used flow. Optimize hard for speed, especially the salesman's create-order experience on mobile.
- **Create order** (Salesman): pick customer → add line items (product + quantity). Product picker should be fast (search, barcode scan, browse by category/brand). As items are added, **show the live server-calculated summary** (prices from the customer's price list, GST, totals) — read-only. Add remarks and expected delivery date. Support many line items smoothly.
- **Order list:** filter by status, customer, route, date; find an order fast.
- **Order detail:** header (customer, dates, status), line items (ordered / approved / loaded quantities per line), and the money breakdown.
- **Edit** a `pending` order (change quantities/remarks). Not editable once approved.
- **Approve** (Manager): set approved quantity per line (can be less than ordered). Approving reserves stock — surface any stock constraints.
- **Load** (Warehouse): confirm quantities actually loaded onto the van per line.
- **Cancel** with optional reason.
- **Generate invoice** from an approved/loaded order.

### 4.10 Inventory (Warehouse, Admin)
- **Stock summary view:** current stock per product per warehouse — physical, reserved, damaged, expiry, and **sellable** stock. Filter by warehouse and/or product. Highlight **low stock** (below minimum).
- **Stock adjustment:** correct a product's stock at a warehouse (positive or negative) with a required reason.
- **Stock transfer:** move a quantity of a product from one warehouse to another.
- **Important:** there is no "edit stock number" field anywhere. Stock only changes through these named actions (and automatically via order load, purchase receive, return complete). Design accordingly — no free-edit of counts.

### 4.11 Purchases (Warehouse, Admin) — buying flow
- **Create purchase** (draft): supplier, destination warehouse, purchase date, line items (product, quantity, purchase price). Show server-calculated GST/total.
- **Purchase list:** filter by status (draft/received/cancelled), supplier, warehouse, date.
- **Purchase detail:** header, items, totals, status.
- **Edit** a `draft` purchase.
- **Receive stock:** confirm received quantity per line — this adds stock to the warehouse.
- **Cancel** a draft (with reason). Cannot cancel once received.

### 4.12 Invoices (Cashier, Manager, Admin)
- **Invoice list:** filter by payment status (unpaid/partial/paid), date, customer; search by invoice number.
- **Invoice detail:** invoice number/date, customer, place of supply, full GST breakdown, total, **payment status**, linked order, its payments, and delivery. A clean, printable/shareable invoice layout is valuable.
- **Cancel** an invoice where allowed (with reason).
- Invoice totals are never editable — display only.

### 4.13 Deliveries (Driver, Dispatcher) — field flow
Design the driver experience mobile-first, minimal taps, glanceable.
- **Assign delivery** (Dispatcher): link an invoice to a vehicle + driver.
- **Driver's delivery list:** today's deliveries with customer, address, status, and amount to collect; a clear "next stop." Map/navigation help is a plus.
- **Delivery detail / progress**, driven by status:
  - **Start** (left warehouse).
  - **Arrive** (capture GPS at the shop).
  - **Complete:** capture GPS, **customer signature**, optional delivery photo, remarks, and **payment collected** (cash and/or UPI, with optional UPI screenshot). One confirm completes delivery, records payment, and updates invoice/order — design it as a single clear "complete delivery" flow even though several things happen.
  - **Fail:** mark unsuccessful with a reason (e.g. shop closed).

### 4.14 Payments (Cashier, Driver) — collections
- **Record payment** against an invoice: cash / UPI / cheque amounts (at least one > 0), optional reference number. Partial payments allowed; an invoice can have several payments over time. Show the invoice's outstanding amount clearly while recording.
- **Payment list / reconciliation (Cashier):** filter by status (pending/cleared/bounced), date, driver; see outstanding dues.
- **Verify** a payment (e.g. cheque cleared).
- **Mark bounced** (with reason).
- Payment status on the invoice is server-derived — display, never edit.

### 4.15 Returns (Warehouse, Manager, Salesman)
- **Create return** against an invoice: overall reason (damaged / expired / wrong_item / not_needed), remarks, optional photo, and line items (product, quantity, per-item reason).
- **Return list:** filter by status (requested/approved/rejected/completed), date.
- **Return detail:** items, reasons, photos, status.
- **Approve / reject** (reject needs a reason).
- **Complete:** receive the goods — stock updates automatically based on reason (good stock back to sellable, damaged, or expired). Design should make the reason → stock outcome understandable.

### 4.16 Tally Sync (Admin/Cashier) — light-touch
- A simple status view of sync state for invoices, payments, and returns (pending / synced / failed counts).
- Trigger a sync and **retry a failed item**. This is a low-frequency admin utility — keep it simple, not prominent.

### 4.17 Reports & Dashboards (Manager, Admin) — v1 essentials
Even a minimal v1 benefits from a few clear views (final scope TBD with us):
- Sales over time; orders by status.
- **Outstanding dues** (by customer / route / age).
- Inventory: stock on hand, low-stock, movement history.
- Delivery performance (completed vs failed).
Design these to be scannable — a few well-chosen numbers and charts beat a dense report.

### 4.18 Customer Self-Service Portal (Customer) — a separate, minimal surface
This is the external-facing app a shop owner uses. Keep it **very simple** — far lighter than the staff app. A customer only ever sees their own data. Design mobile-first (many shop owners will use a phone), but it should work on desktop too.

- **Home:** prominent "Place an order," recent orders with status, and outstanding dues.
- **Browse catalogue:** search/scan products, browse by category/brand, see **their own price** (from their assigned price list) and whether it's in stock. No cost prices, no other customers' prices, no admin data.
- **Place an order:** add products + quantities to a cart-like flow, see the **server-calculated** summary (prices, GST, total) as read-only, add remarks/expected delivery, submit. The customer never selects "which customer" — it's always themselves. Confirmation on submit; the order starts as `pending` awaiting the distributor's approval — make that expectation clear.
- **My orders:** list + detail of their own orders, with status through the lifecycle (pending → approved → loaded → delivered) and the quantities/amounts.
- **Edit / cancel:** allowed only while an order is still `pending`.
- **My invoices & dues:** view their invoices with GST breakdown, payment status, and **total outstanding** — read-only. (No online payment in v1.)
- **My deliveries:** track delivery status for their orders (and, where available, expected/أarrival info).
- **Profile:** view their business details; editing may be limited (confirm with us what a customer can change vs. what only staff can).

**Explicitly NOT in the customer portal:** approvals, loading, invoicing actions, payment recording/verification, purchases, inventory, returns processing, master data, reports, or anything about other customers.

---

## 5. Navigation Map by Role (starting point)

Use this to scope each role's app surface; refine with us.

| Module | Admin | Manager | Salesman | Driver | Cashier | Warehouse |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Dashboard (role home) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Users | ✅ | – | – | – | – | – |
| Routes | ✅ | ✅ | – | – | – | – |
| Customers | ✅ | ✅ | ✅ (own route) | – | – | – |
| Catalogue (products/categories/brands) | ✅ | ✅ | view | view | – | view |
| Price Lists | ✅ | ✅ | – | – | – | – |
| Warehouses / Suppliers | ✅ | ✅ | – | – | – | view |
| Vehicles | ✅ | ✅ | – | – | – | ✅ |
| Sales Orders | ✅ | ✅ (approve) | ✅ (create) | – | – | ✅ (load) |
| Inventory | ✅ | ✅ | view stock | – | – | ✅ |
| Purchases | ✅ | ✅ | – | – | – | ✅ |
| Invoices | ✅ | ✅ | – | – | ✅ | – |
| Deliveries | ✅ | ✅ | – | ✅ | – | ✅ (assign) |
| Payments | ✅ | ✅ | – | ✅ (collect) | ✅ | – |
| Returns | ✅ | ✅ (approve) | ✅ (create) | – | – | ✅ (process) |
| Tally Sync | ✅ | – | – | – | ✅ | – |
| Reports | ✅ | ✅ | – | – | view | view |

(✅ = full use, "view" = read-only, "–" = not shown. This is a proposal — we'll finalize permissions.)

> **Customer** is intentionally **not** a column above — customers use a **separate portal** (§4.18), not the staff navigation. Their entire surface is: catalogue (their prices), place order, my orders, my invoices/dues, my deliveries, profile. Nothing else.

---

## 6. Key End-to-End Journeys to Design For

Design these as smooth flows, not just isolated screens. These are the moments that make or break daily use.

1. **Salesman takes an order (mobile, at the shop):** open app → find/select customer → add products fast (search/scan) → see live total → add note → submit → confirmation. Must be quick and possible on weak signal.
2. **Customer places their own order (self-service portal):** log in → land on portal home → browse/search catalogue at their own prices → add products + quantities → review server-calculated total → submit → see "pending, awaiting approval" confirmation → later track status, invoice, and delivery. Keep it dead simple and reassuring.
3. **Manager approves & warehouse loads (desktop):** review pending order (from salesman *or* customer) → approve quantities (stock reserved) → warehouse confirms loaded quantities → generate invoice.
4. **Driver delivers & collects (mobile):** see today's route → navigate to shop → arrive (GPS) → hand over goods → capture signature/photo → record cash/UPI → complete → next stop.
5. **Cashier reconciles (desktop):** review collected payments → verify cleared ones → mark bounced cheques → track outstanding dues.
6. **Warehouse receives stock (desktop):** create purchase → receive → stock updates.
7. **Return handling:** raise return against invoice with photo → approve → complete → stock adjusts by reason.

---

## 7. What We're Asking You For (Deliverable)

1. Propose the **screen inventory** (list of screens) covering the modules and roles above.
2. Design **key flows first** (§6) — especially salesman order-taking and driver delivery (mobile), and order approval + invoicing + payment reconciliation (desktop).
3. Cover the **standard patterns** once and reuse: list/table, detail, create/edit form, status display, empty/loading/error states, photo capture, GPS/map.
4. Keep it **clean, minimal, fast, and friendly** — the fewest steps to finish each role's core task, no visual clutter, obvious next actions.

We'll review your proposals, approve what works, and request modifications. This document defines the functional coverage; the design language and layout are yours to propose.

---

*Keep this document aligned with `api_reference.md` — if a feature or field changes there, reflect it here so design and build stay in sync.*
